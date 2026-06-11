// src/api/searchHistory.js
const express = require('express');
const router = express.Router();
    const HistoryRepository = require('../../repositories/PriceHistoryRepository');
    const TaskRepository = require('../../repositories/TaskRepository');



router.get('/tasks', async (req, res, next) => {
    try {
     
        const tasks = await TaskRepository.findAll();
        return res.status(200).json(tasks);
    } catch (error) {
        next(error);
    }
});


router.get('/tasks/:taskId/products', async (req, res, next) => {
    try {
        const { taskId } = req.params;
        if (!taskId) {
            return res.status(400).json({ error: 'Параметр taskId обязателен' });
        }

        const products = await HistoryRepository.getProductsByTaskId(taskId);
        return res.status(200).json(products);
    } catch (error) {
        next(error);
    }
});


router.get('/tasks/:taskId/products/:productId/sellers', async (req, res, next) => {
    try {
        const { taskId, productId } = req.params;
        if (!taskId || !productId) {
            return res.status(400).json({ error: 'Параметры taskId и productId обязательны' });
        }

        const offers = await HistoryRepository.getSellersByTaskAndProduct(taskId, productId);
        return res.status(200).json(offers);
    } catch (error) {
        next(error);
    }
});

module.exports = router;