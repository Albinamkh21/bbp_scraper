// 1. Отключаем буферизацию Docker, чтобы видеть логи мгновенно
if (process.stdout._handle && typeof process.stdout._handle.setBlocking === 'function') {
    process.stdout._handle.setBlocking(true);
}

// 2. Жесткий лог старта
console.log('===================================================');
console.log('[NODE SYSTEM] Инициализация воркера успешно запущена!');
console.log('===================================================');

const { Worker } = require('bullmq');
const config = require('../config/appConfig');
const { SCRAPING_QUEUE_NAME } = require('../core/QueueClient');
const db = require('../core/Database');
const ScrapingOrchestrator = require('../app/ScrapingOrchestrator');
const KaspiScraper = require('../scrapers/KaspiScraper')
const TaskRepository = require('../repositories/TaskRepository');

console.log('[WORKER] Фоновый процесс обработки очередей успешно запущен...');

const worker = new Worker(SCRAPING_QUEUE_NAME, async (job) => {
    const { taskId, query } = job.data;
    console.log(`[Job ${job.id}] Взят в работу таск ${taskId} с поисковым запросом: "${query}"`);

    try {
        // 1. Переводим задачу в статус выполнения
        await TaskRepository.updateStatus(taskId, 'processing');

        const scraperStrategy = new KaspiScraper();
        const orchestrator = new ScrapingOrchestrator(scraperStrategy);
        const scrapingResults = await orchestrator.run(query); // Вызов метода парсинга

        await TaskRepository.updateStatus(taskId, 'completed');


        console.log(`[Job ${job.id}] Таск ${taskId} успешно завершен.`);
        return scrapingResults;
    } catch (error) {
        console.error(`[Job ${job.id}] Критическая ошибка при обработке таска ${taskId}:`, error);

        // Если лимит попыток исчерпан — фиксируем финальный сбой в БД
        if (job.attemptsMade >= job.opts.attempts) {
            try {
                await TaskRepository.updateStatus(taskId, 'failed');
              
                console.log(`[Job ${job.id}] Таск ${taskId} помечен как failed.`);
            } catch (dbError) {
                console.error(`[Job ${job.id}] Не удалось обновить статус ошибки в БД:`, dbError);
            }
        }
    }
}, {
    connection: { url: config.redis.url },
    concurrency: 1 // Жесткое ограничение: 1 воркер = 1 инстанс Chromium (Защита от утечек RAM и банов)
});

worker.on('failed', (job, err) => {
    console.error(`[WORKER CRITICAL] Задача ${job?.id} окончательно провалилась: ${err.message}`);
});