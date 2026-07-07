// src/schedulers/scrapingScheduler.js
const { Queue } = require('bullmq');
const IORedis = require('ioredis');
const config = require('../config/appConfig');
const redisConnection = new IORedis(process.env.REDIS_URL, { maxRetriesPerRequest: null });
const { scrapingQueue } = require('../core/QueueClient'); // Используем очередь скрапинга

async function initScrapingScheduler() {
    console.log('[Scheduler] Синхронизация расписания скрапинга...');
    
    // Допустим, в конфиге у тебя лежит массив авто-задач cronTasks
    const tasksConfig = config.scraping.schedules.cronTasks || [];
    const repeatableJobs = await scrapingQueue.getRepeatableJobs();
    
    // 1. Очищаем старые задачи именно из этой очереди
    for (const job of repeatableJobs) {
        // Если задачи больше нет в конфиге или поменялся её крон — удаляем
        const configTask = tasksConfig.find(t => t.id === job.id);
        if (!configTask || configTask.cron !== job.cron) {
            await scrapingQueue.removeRepeatableByKey(job.key);
        }
    }

    // 2. Добавляем актуальные задачи из конфига
    for (const task of tasksConfig) {
        const exists = repeatableJobs.some(job => job.id === task.id && job.cron === task.cron);
        
        if (exists) continue; // Если уже есть с таким кроном, пропускаем

        // Пушим триггер-задачу в очередь скрапинга
        await scrapingQueue.add('trigger-scheduled-task', task.data, {
            jobId: task.id, 
            repeat: { cron: task.cron }
        });
        console.log(`[Scheduler] Авто-задача добавлена в расписание: "${task.id}"`);
    }
}

module.exports = { initScrapingScheduler };