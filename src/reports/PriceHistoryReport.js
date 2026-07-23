// src/reports/PriceHistoryReport.js
//
// Отчёт «История цен».
// Строит сводную (pivot) таблицу:
//   Строки  — уникальные пары (Товар × Продавец)
//   Колонки — фиксированные поля товара/продавца + динамические даты сканирования
//   Значение в ячейке — цена на соответствующую дату
//
// Фильтры (все необязательны):
//   dateFrom    {string}   — ISO-дата начала периода (включительно)
//   dateTo      {string}   — ISO-дата конца периода  (включительно, до 23:59:59)
//   productIds  {number[]} — IDs конкретных товаров; пусто → все
//   categoryIds {string[]} — IDs категорий;          пусто → все

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class PriceHistoryReport {
    /**
     * @param {object} filters
     * @returns {Promise<{ columns: string[], rows: object[] }>}
     */
    async generate(filters = {}) {
        const { dateFrom, dateTo, productIds = [], categoryIds = [] } = filters;

        const where = {};

        // ── Фильтр по периоду ───────────────────────────────────────────────
        if (dateFrom || dateTo) {
            where.scannedAt = {};
            if (dateFrom) {
                where.scannedAt.gte = new Date(dateFrom);
            }
            if (dateTo) {
                const end = new Date(dateTo);
                end.setHours(23, 59, 59, 999);
                where.scannedAt.lte = end;
            }
        }

        // ── Фильтр по товарам ────────────────────────────────────────────────
        if (Array.isArray(productIds) && productIds.length > 0) {
            where.productId = { in: productIds.map(Number) };
        }

        // ── Фильтр по категориям (через связь product → categoryId) ──────────
        if (Array.isArray(categoryIds) && categoryIds.length > 0) {
            where.product = { categoryId: { in: categoryIds } };
        }

        const records = await prisma.priceHistory.findMany({
            where,
            include: {
                product: { select: { id: true, title: true, sku: true, url: true } },
                seller:  { select: { id: true, name: true,  url: true } },
            },
            orderBy: { scannedAt: 'asc' },
        });

        const FIXED_COLUMNS = ['title', 'sku', 'product_url', 'seller_name', 'seller_url'];

        if (records.length === 0) {
            return { columns: FIXED_COLUMNS, rows: [] };
        }

        // ── Собираем уникальные даты (группировка по дню YYYY-MM-DD) ────────
        const dateSet = new Set();
        for (const r of records) {
            dateSet.add(r.scannedAt.toISOString().slice(0, 10));
        }
        const dates = Array.from(dateSet).sort();

        // ── Строим pivot: ключ = "productId_sellerId" ────────────────────────
        // Для одной и той же пары (продукт, продавец, дата) берём последнюю цену.
        const pivotMap = new Map();     // key → row object
        const latestTs  = new Map();    // "key__date" → latest scannedAt Date

        for (const r of records) {
            const key    = `${r.productId}_${r.sellerId}`;
            const date   = r.scannedAt.toISOString().slice(0, 10);
            const tsKey  = `${key}__${date}`;

            if (!pivotMap.has(key)) {
                pivotMap.set(key, {
                    title:       r.product.title,
                    sku:         r.product.sku,
                    product_url: r.product.url || '',
                    seller_name: r.seller.name,
                    seller_url:  r.seller.url  || '',
                });
            }

            const prevTs = latestTs.get(tsKey);
            if (!prevTs || r.scannedAt > prevTs) {
                pivotMap.get(key)[date] = Number(r.price);
                latestTs.set(tsKey, r.scannedAt);
            }
        }

        const columns = [...FIXED_COLUMNS, ...dates];

        const rows = Array.from(pivotMap.values()).map((row) => {
            const clean = {};
            for (const col of columns) {
                clean[col] = row[col] ?? '';
            }
            return clean;
        });

        return { columns, rows };
    }
}

module.exports = PriceHistoryReport;
