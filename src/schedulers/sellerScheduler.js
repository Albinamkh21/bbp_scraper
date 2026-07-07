const { Queue } = require('bullmq');
const IORedis = require('ioredis');
const config = require('../config/appConfig');
const redisConnection = new IORedis(process.env.REDIS_URL, { maxRetriesPerRequest: null });
const { sellerQueue } = require('../core/QueueClient');




async function initScheduler() {
    console.log('[Scheduler] Синхронизация расписания...');
    
    const cronExpression = config.scraping.schedules.sellerPhones;
    
    
    const repeatableJobs = await sellerQueue.getRepeatableJobs();
    
    // 2. Проверяем, есть ли уже задача с таким кроном
    const exists = repeatableJobs.some(job => job.cron === cronExpression);
    
    if (exists) {
        console.log('[Scheduler] Задача уже в расписании, ничего менять не нужно.');
        return;
    }

    // 3. Если задачи нет (или крон изменился), очищаем старые и добавляем новую
    for (const job of repeatableJobs) {
        await sellerQueue.removeRepeatableByKey(job.key);
    }

   await sellerQueue.add('sync-seller-phones', {}, {
        repeat: { 
            cron: cronExpression 
        }
    })
    
    console.log(`[Scheduler] Расписание обновлено: "${cronExpression}"`);
}
module.exports = { initScheduler };