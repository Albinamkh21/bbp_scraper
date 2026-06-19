// src/api/server.js
const express = require('express');
const cookieParser = require('cookie-parser'); 
const config = require('../config/appConfig');
const MarketplaceRepository = require('../repositories/MarketplaceRepository');
const TaskRepository = require('../repositories/TaskRepository');
const { scrapingQueue } = require('../core/QueueClient');
const { initScheduler } = require('../schedulers/sellerScheduler');
require('../worker/sellerWorker');

const historyRouter = require('./routes/searchHistory');
const authRouter = require('./routes/auth'); 
const { protect } = require('../middlewares/auth.middleware');

const app = express();

// Мидлвары
app.use(express.json());
app.use(cookieParser()); 

// Docker Healthcheck
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// Маршруты API
app.use('/api/auth', authRouter); // Роуты: /register, /login, /refresh, /logout
app.use('/api/history', historyRouter);

// Создание задачи парсинга через HTTP POST
app.post('/api/tasks', protect, async (req, res, next) => {
    try {
        const { query, marketplace = 'Kaspi' } = req.body;
        
        if (!query) {
            return res.status(400).json({ error: 'Параметр query обязателен' });
        }

        const baseUrl = marketplace === 'Kaspi' ? 'https://kaspi.kz' : '';
        const mpRecord = await MarketplaceRepository.upsert({ name: marketplace, baseUrl });

        const task = await TaskRepository.create({
            marketplaceId: mpRecord.id,
            searchType: 'query',
            query: query
        });
        
        const taskId = task.id;

        // Отправка задачи в Redis (Bull)
        await scrapingQueue.add('scrape-job', { taskId, query }, {
            attempts: 3,
            backoff: { type: 'exponential', delay: 5000 }
        });

        return res.status(202).json({ taskId, status: 'pending' });
    } catch (error) {
        next(error);
    }
});

// Централизованный обработчик ошибок
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