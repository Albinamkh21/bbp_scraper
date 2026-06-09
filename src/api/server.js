// src/api/server.js
const express = require('express');
const config = require('../config/appConfig');
const MarketplaceRepository = require('../repositories/MarketplaceRepository');
const TaskRepository = require('../repositories/TaskRepository');
const { scrapingQueue } = require('../core/QueueClient');
const { initScheduler } = require('../schedulers/sellerScheduler');
require('../worker/sellerWorker');

const app = express();
app.use(express.json());

// Docker Healthcheck
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// Создание задачи на парсинг
app.post('/api/tasks', async (req, res, next) => {
    try {
        const { query, marketplace = 'Kaspi' } = req.body;
        
        if (!query) {
            return res.status(400).json({ error: 'Параметр query обязателен' });
        }

        // Динамически получаем маркетплейс и создаем задачу через Prisma
        const baseUrl = marketplace === 'Kaspi' ? 'https://kaspi.kz' : '';
        const mpRecord = await MarketplaceRepository.upsert({ name: marketplace, baseUrl });

        const task = await TaskRepository.create({
            marketplaceId: mpRecord.id,
            searchType: 'query',
            query: query
        });
        
        const taskId = task.id;




        // Передача задачи в брокер Redis
        await scrapingQueue.add('scrape-job', { taskId, query }, {
            attempts: 3, // Политика повторов
            backoff: { type: 'exponential', delay: 5000 }
        });

        return res.status(202).json({ taskId, status: 'pending' });
    } catch (error) {
        next(error); // Передаем ошибку в центральный обработчик
    }
});

// Централизованный Error Handler Middleware
app.use((err, req, res, next) => {
    console.error(`[API ERROR] ${err.message}`, err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(3000, async () => {
    console.log(`[API] Сервер запущен на внутреннем порту 3000 (Хост-порт: ${config.app.port})`);
    try {
        await initScheduler();
    } catch (cronError) {
        console.error('[API ERROR] Не удалось запустить планировщик телефонов:', cronError.message);
    }
});