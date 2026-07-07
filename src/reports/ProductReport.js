// src/reports/ProductReport.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class ProductReport {
    /**
     * @param {object} filters - optional filters (currently unused for product_short)
     * @returns {Promise<{ columns: string[], rows: object[] }>}
     */
    async generate(filters = {}) {
        const products = await prisma.product.findMany({
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
