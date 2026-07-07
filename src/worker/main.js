// main.js
const { Worker } = require('bullmq');
const IORedis = require('ioredis');
const broadcastService = require('../services/BroadcastService');

// Импортируем обработчики (функции, которые делают работу)
const { processSellerJob } = require('./sellerWorker'); 
const { processScrapingJob } = require('./index'); // Убедись, что в index.js есть module.exports = { processScrapingJob: ... }

// Импортируем имена очередей из твоего QueueClient (чтобы не было опечаток)
const { SCRAPING_QUEUE_NAME, SELLER_QUEUE_NAME } = require('../core/QueueClient');

const redisConnection = new IORedis(process.env.REDIS_URL, { maxRetriesPerRequest: null });

// Инициализируем BroadcastService для логирования
(async () => {
  await broadcastService.connect();
  console.log('[Worker] BroadcastService подключен');
})();

// 1. Воркер для продавцов
const sellerWorker = new Worker(SELLER_QUEUE_NAME, processSellerJob, { 
    connection: redisConnection,
    concurrency: 1 
});

// 2. Воркер для общего скрапинга
const scrapingWorker = new Worker(SCRAPING_QUEUE_NAME, processScrapingJob, { 
    connection: redisConnection,
    concurrency: 1 
});

console.log('[Worker] Оба воркера запущены и ждут задач...');