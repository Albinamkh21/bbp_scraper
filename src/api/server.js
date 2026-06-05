// src/api/server.js
const express = require('express');
const config = require('../config/appConfig');
const db = require('../core/Database');
const { scrapingQueue } = require('../core/QueueClient');

const app = express();
app.use(express.json());

// Docker Healthcheck
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// Создание задачи на парсинг
app.post('/api/tasks', async (req, res, next) => {
    try {
        const { query } = req.body;
        if (!query) {
            return res.status(400).json({ error: 'Параметр query обязателен' });
        }

        // Атомарная транзакция создания задачи в Postgres (Статус по умолчанию 'pending')
        const dbResult = await db.query(
            'INSERT INTO search_tasks (query, status) VALUES ($1, $2) RETURNING id',
            [query, 'pending']
        );
        const taskId = dbResult.rows[0].id;

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

app.listen(3000, () => {
    console.log(`[API] Сервер запущен на внутреннем порту 3000 (Хост-порт: ${config.app.port})`);
});