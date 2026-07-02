// src/api/server.js
const express = require('express');
const cookieParser = require('cookie-parser'); 
const config = require('../config/appConfig');
const { scrapingQueue } = require('../core/QueueClient');
const { initScheduler } = require('../schedulers/sellerScheduler');
const taskRoutes = require('./routes/tasks');
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
app.use('/api/auth', authRouter); 
app.use('/api/history', historyRouter);
app.use('/api/tasks', taskRoutes);



// Централизованный обработчик ошибок
app.use((err, req, res, next) => {
    console.error(`[API ERROR] ${err.message}`, err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(3000, async () => {
    console.log(`[API] Сервер запущен на внутреннем порту 3000 (Хост-порт: ${config.app.port})`);
    try {
        //await initScheduler();
    } catch (cronError) {
        console.error('[API ERROR] Не удалось запустить планировщик телефонов:', cronError.message);
    }
});