// src/api/controllers/catalogController.js
// Простые список-эндпоинты для заполнения фильтров на фронте.

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * GET /api/catalog/products
 * Возвращает [{id, title, sku}] по всем товарам, сортировка по title.
 */
const getProducts = async (req, res, next) => {
    try {
        const products = await prisma.product.findMany({
            select: { id: true, title: true, sku: true },
            orderBy: { title: 'asc' },
        });
        res.json(products);
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/catalog/categories
 * Возвращает [{id, name, parentId}] по всем категориям, сортировка по name.
 */
const getCategories = async (req, res, next) => {
    try {
        const categories = await prisma.category.findMany({
            select: { id: true, name: true, parentId: true },
            orderBy: { name: 'asc' },
        });
        res.json(categories);
    } catch (err) {
        next(err);
    }
};

module.exports = { getProducts, getCategories };
