// src/reports/SellerReport.js
//
// Отчёт «Продавцы по товарам».
// Для каждой пары (Товар × Продавец) выводит актуальную цену продавца,
// а также мин. и макс. цену по данному товару среди всех продавцов.
//
// Фильтры (оба необязательны, работают как OR — подходит хотя бы одно):
//   productIds  {number[]} — конкретные товары; пусто → все
//   categoryIds {string[]} — категории товаров; пусто → все
//
// Если оба фильтра пусты — отчёт строится по всем товарам с историей цен.

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const COLUMNS = [
    'Товар',
    'SKU',
    'Продавец',
    'Телефон',
    'Цена продавца',
    'Мин. цена (товар)',
    'Макс. цена (товар)',
];

class SellerReport {
    /**
     * @param {object}   filters
     * @param {number[]} [filters.productIds]   — IDs конкретных товаров
     * @param {string[]} [filters.categoryIds]  — IDs категорий
     * @returns {Promise<{ columns: string[], rows: object[] }>}
     */
    async generate(filters = {}) {
        const { productIds = [], categoryIds = [] } = filters;

        // ── Собираем условия фильтрации ──────────────────────────────────────
        // productIds и categoryIds объединяются через OR:
        //   «покажи историю цен для товаров из списка ИЛИ из выбранных категорий»
        const where = {};
        const conditions = [];

        if (Array.isArray(productIds) && productIds.length > 0) {
            conditions.push({ productId: { in: productIds.map(Number) } });
        }

        if (Array.isArray(categoryIds) && categoryIds.length > 0) {
            conditions.push({ product: { categoryId: { in: categoryIds } } });
        }

        if (conditions.length === 1) {
            Object.assign(where, conditions[0]);
        } else if (conditions.length > 1) {
            where.OR = conditions;
        }
        // если оба пусты — where остаётся {} → берём все записи

        // ── Запрос к БД ──────────────────────────────────────────────────────
        // Сортируем desc по scannedAt, чтобы первая запись на пару (product, seller)
        // всегда была самой свежей — используем это при построении pivotMap.
        const records = await prisma.priceHistory.findMany({
            where,
            include: {
                product: { select: { id: true, title: true, sku: true } },
                seller:  { select: { id: true, name: true, phone: true } },
            },
            orderBy: { scannedAt: 'desc' },
        });

        if (records.length === 0) {
            return { columns: COLUMNS, rows: [] };
        }

        // ── Шаг 1: берём только последнюю цену на пару (productId, sellerId) ─
        // Т.к. записи отсортированы desc по scannedAt, первое вхождение = последняя цена.
        const latestMap = new Map(); // "productId_sellerId" → record

        for (const r of records) {
            const key = `${r.productId}_${r.sellerId}`;
            if (!latestMap.has(key)) {
                latestMap.set(key, r);
            }
        }

        // ── Шаг 2: вычисляем мин/макс по товару из актуальных цен ─────────────
        const stats = new Map(); // productId → { min, max }

        for (const r of latestMap.values()) {
            const price = Number(r.price);
            const s = stats.get(r.productId) ?? { min: Infinity, max: -Infinity };
            if (price < s.min) s.min = price;
            if (price > s.max) s.max = price;
            stats.set(r.productId, s);
        }

        // ── Шаг 3: строим строки отчёта ──────────────────────────────────────
        const rows = [];

        for (const r of latestMap.values()) {
            const price = Number(r.price);
            const s = stats.get(r.productId);

            rows.push({
                'Товар':              r.product.title,
                'SKU':                r.product.sku,
                'Продавец':           r.seller.name,
                'Телефон':            r.seller.phone || '—',
                'Цена продавца':      price,
                'Мин. цена (товар)':  s.min,
                'Макс. цена (товар)': s.max,
            });
        }

        // Сортируем: сначала по названию товара, потом по продавцу
        rows.sort((a, b) =>
            a['Товар'].localeCompare(b['Товар'], 'ru') ||
            a['Продавец'].localeCompare(b['Продавец'], 'ru')
        );

        return { columns: COLUMNS, rows };
    }
}

module.exports = SellerReport;
