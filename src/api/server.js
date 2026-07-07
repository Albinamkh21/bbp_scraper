// src/api/server.js
const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const Redis = require('ioredis');
const cookieParser = require('cookie-parser'); 
const config = require('../config/appConfig');
const { scrapingQueue } = require('../core/QueueClient');
const { initScheduler } = require('../schedulers/sellerScheduler');
const { initScrapingScheduler } = require('../schedulers/scrapingScheduler'); 
const taskRoutes = require('./routes/tasks');
const historyRouter = require('./routes/searchHistory');
const authRouter = require('./routes/auth'); 
const reportRoutes = require('./routes/reports');
const { protect } = require('../middlewares/auth.middleware');

const app = express();
const server = http.createServer(app);

// Мидлвары
app.use(express.json());
app.use(cookieParser()); 

// Docker Healthcheck
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// Маршруты API
app.use('/api/auth', authRouter); 
app.use('/api/history', historyRouter);
app.use('/api/tasks', taskRoutes);
app.use('/api/reports', reportRoutes);



// Централизованный обработчик ошибок
app.use((err, req, res, next) => {
    console.error(`[API ERROR] ${err.message}`, err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
});

// ===== WebSocket Server для логов задач =====
const wss = new WebSocketServer({ noServer: true });

// Храним соединения по taskId
const taskConnections = new Map(); // taskId -> Set<WebSocket>

// 2. Вручную перехватываем Upgrade-запросы HTTP-сервера для динамических путей
server.on('upgrade', (request, socket, head) => {
    const url = request.url || '';

    // Проверяем, что запрос начинается с нашего роута
    if (url.startsWith('/ws/task/')) {
        // Передаем управление серверу WebSocket
        wss.handleUpgrade(request, socket, head, (ws) => {
            wss.emit('connection', ws, request);
        });
    } else {
        // Если это какой-то левый апгрейд сокета, тушим его
        socket.destroy();
    }
});

wss.on('connection', (ws, req) => {
    // Парсим taskId из пути (например: /ws/task/123)
    const urlParts = req.url.split('/');
    const taskId = urlParts[urlParts.length - 1];

    if (!taskId || taskId === 'task') {
        console.log('[WebSocket] Соединение отклонено: не указан taskId');
        ws.close();
        return;
    }

    console.log(`[WebSocket] Новое соединение для задачи ${taskId}`);

    if (!taskConnections.has(taskId)) {
        taskConnections.set(taskId, new Set());
    }
    taskConnections.get(taskId).add(ws);

    ws.on('close', () => {
        console.log(`[WebSocket] Соединение закрыто для задачи ${taskId}`);
        const connections = taskConnections.get(taskId);
        if (connections) {
            connections.delete(ws);
            if (connections.size === 0) {
                taskConnections.delete(taskId);
            }
        }
    });

    ws.on('error', (error) => {
        console.error(`[WebSocket] Ошибка соединения для задачи ${taskId}:`, error.message);
    });
});

// Подписка на Redis каналы для логов
const redisSubscriber = new Redis(config.redis.url);

redisSubscriber.on('error', (err) => {
    console.error('[Redis Subscriber] Ошибка:', err.message);
});

redisSubscriber.on('connect', () => {
    console.log('[Redis Subscriber] Подключено к Redis для прослушивания логов');
});

// Подписываемся на паттерн task:*:logs
redisSubscriber.psubscribe('task:*:logs', (err, count) => {
    if (err) {
        console.error('[Redis Subscriber] Ошибка подписки:', err.message);
    } else {
        console.log(`[Redis Subscriber] Подписано на ${count} паттерн(ов)`);
    }
});

// Обрабатываем входящие сообщения
redisSubscriber.on('pmessage', (pattern, channel, message) => {
    try {
        // Извлекаем taskId из канала (task:123:logs -> 123)
        const taskId = channel.split(':')[1];
        const logData = JSON.parse(message);

        // Отправляем всем подключенным клиентам для этой задачи
        const connections = taskConnections.get(taskId);
        if (connections && connections.size > 0) {
            const payload = JSON.stringify(logData);
            connections.forEach((ws) => {
                if (ws.readyState === ws.OPEN) {
                    ws.send(payload);
                }
            });
        }
    } catch (error) {
        console.error('[Redis Subscriber] Ошибка обработки сообщения:', error.message);
    }
});

server.listen(3000, async () => {
    console.log(`[API] Сервер запущен на внутреннем порту 3000 (Хост-порт: ${config.app.port})`);
    try {
        //await initScheduler();
        await initScrapingScheduler();
    } catch (cronError) {
        console.error('[API ERROR] Не удалось запустить планировщик телефонов:', cronError.message);
    }
});