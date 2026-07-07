// 1. Отключаем буферизацию Docker, чтобы видеть логи мгновенно
if (process.stdout._handle && typeof process.stdout._handle.setBlocking === 'function') {
    process.stdout._handle.setBlocking(true);
}

// 2. Жесткий лог старта модуля
console.log('===================================================');
console.log('[NODE SYSTEM] Модуль скрапинга инициализирован!');
console.log('===================================================');

const config = require('../config/appConfig');
const ScrapingOrchestrator = require('../app/ScrapingOrchestrator');
const KaspiScraper = require('../scrapers/KaspiScraper');
const TaskRepository = require('../repositories/TaskRepository');
const taskService = require('../services/TaskService'); // Подключаем твой новый сервис

/**
 * Единый обработчик задач для очереди SCRAPING_QUEUE_NAME
 * Его импортирует и запускает main.js
 */
const processScrapingJob = async (job) => {
    
    // === СЦЕНАРИЙ 1: Сработало расписание Крона (Будильник) ===
    if (job.name === 'trigger-scheduled-task') {
        const { query, marketplace, maxItems, searchType } = job.data;
        console.log(`[Job ${job.id}] ⏰ Крон активировал автоматический запуск для: "${query}"`);

        try {
            // Вызываем созданный TaskService — он сам сделает всё без дублирования кода
            await taskService.createAndQueueTask({
                query: `[Авто] ${query}`, // Метка для UI
                marketplace,
                maxItems,
                searchType
            });
            return { status: 'scheduled_task_triggered' };
        } catch (cronError) {
            console.error(`[Job ${job.id}] Ошибка при создании задачи по расписанию:`, cronError);
            throw cronError; // Пробрасываем ошибку, чтобы BullMQ пометил задачу как failed
        }
    }

    // === СЦЕНАРИЙ 2: Обычный парсинг товара (для ручных и автоматических тасков) ===
    // Если имя джобы не триггер, значит это обычный 'scrape-job'
    const { taskId, query, maxItems, searchType } = job.data;
    console.log(`[Job ${job.id}] Взят в работу таск ${taskId} с поисковым запросом: "${query}"`);

    try {
        // 1. Переводим задачу в статус выполнения в БД
        await TaskRepository.updateStatus(taskId, 'processing');

        // 2. Запускаем оркестратор со стратегией Каспи
        const scraperStrategy = new KaspiScraper();
        const orchestrator = new ScrapingOrchestrator(scraperStrategy);
        const scrapingResults = await orchestrator.run(query, maxItems, searchType, taskId);

        // 3. Успешно завершаем задачу в БД
        await TaskRepository.updateStatus(taskId, 'completed');

        console.log(`[Job ${job.id}] Таск ${taskId} успешно завершен.`);
        return scrapingResults;
        
    } catch (error) {
        console.error(`[Job ${job.id}] Критическая ошибка при обработке таска ${taskId}:`, error);

        // Если лимит попыток исчерпан — фиксируем финальный сбой в БД
        const maxAttempts = job.opts?.attempts || 1;
        if (job.attemptsMade >= maxAttempts) {
            try {
                await TaskRepository.updateStatus(taskId, 'failed');
                console.log(`[Job ${job.id}] Таск ${taskId} окончательно провален и помечен как failed в БД.`);
            } catch (dbError) {
                console.error(`[Job ${job.id}] Не удалось обновить статус ошибки в БД:`, dbError);
            }
        }
        
        throw error; // Обязательно выкидываем ошибку наружу, чтобы BullMQ знал, что джоба зафейлилась
    }
};

// Экспортируем функцию для main.js
module.exports = { processScrapingJob };