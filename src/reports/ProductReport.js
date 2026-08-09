// src/reports/ProductReport.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class ProductReport {
    /**
     * @param {object}   filters
     * @param {string}   [filters.title]       — подстрока названия товара (регистронезависимо)
     * @param {string[]} [filters.categoryIds] — IDs категорий; пусто → все
     * @returns {Promise<{ columns: string[], rows: object[] }>}
     */
    async generate(filters = {}) {
        const { title, categoryIds = [] } = filters;

        const where = {};

        if (title && title.trim()) {
            where.title = { contains: title.trim(), mode: 'insensitive' };
        }

        if (Array.isArray(categoryIds) && categoryIds.length > 0) {
            where.categoryId = { in: categoryIds };
        }

        const products = await prisma.product.findMany({
            where,
            select: {
                id: true,
                title: true,
                sku: true,
                rawCategories: true,
            },
        });

        const columns = ['id', 'title', 'sku', 'raw_categories'];

        const rows = products.map((p) => ({
            id: p.id,
            title: p.title,
            sku: p.sku,
            raw_categories: Array.isArray(p.rawCategories) ? p.rawCategories.join(' > ') : '',
        }));

        return { columns, rows };
    }
}

module.exports = ProductReport;

