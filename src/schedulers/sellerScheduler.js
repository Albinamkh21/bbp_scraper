// /app/src/schedulers/sellerScheduler.js
const { Queue } = require('bullmq');
const IORedis = require('ioredis'); // Добавляем ioredis напрямую
const config = require('../config/appConfig');

// Создаем подключение строго по REDIS_URL из окружения Docker
const redisConnection = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null
});

const sellerQueue = new Queue('seller-details-queue', { 
  connection: redisConnection 
});

async function initScheduler() {
  console.log('[Scheduler] Проверяем расписание в Redis...');
  
  const repeatableJobs = await sellerQueue.getRepeatableJobs();
  for (const job of repeatableJobs) {
    await sellerQueue.removeRepeatableByKey(job.key);
  }

  const cronExpression = config.scraping.schedules.sellerPhones;

  await sellerQueue.add('sync-seller-phones', {}, {
    repeat: { cron: cronExpression }
  });
  
  console.log(`[Scheduler] Задачник телефонов запущен по расписанию: "${cronExpression}"`);
}

module.exports = { initScheduler, sellerQueue };