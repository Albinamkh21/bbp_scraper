// src/services/SchedulerService.js
// "Мозг" планировщика: знает и про таблицу scheduled_tasks в БД, и про очереди BullMQ.
const { scrapingQueue, sellerQueue } = require('../core/QueueClient');
const ScheduledTaskRepository = require('../repositories/ScheduledTaskRepository');

// Логическое имя очереди (из БД) -> реальный инстанс очереди BullMQ
const QUEUE_MAP = {
    scraping: scrapingQueue,
    seller: sellerQueue
};

function getQueue(queueName) {
    const queue = QUEUE_MAP[queueName];
    if (!queue) {
        throw new Error(`[SchedulerService] Неизвестная очередь: "${queueName}"`);
    }
    return queue;
}

// Стабильный jobId репитабл-джобы в BullMQ, привязанный к конкретной записи в БД.
// Благодаря этому мы всегда можем однозначно найти "свою" джобу через getRepeatableJobs().
function buildJobId(task) {
    return `scheduled-task-${task.id}`;
}

class SchedulerService {
    async getAll() {
        return ScheduledTaskRepository.findAll();
    }

    async getById(id) {
        return ScheduledTaskRepository.findById(id);
    }

    async createTask(data) {
        const created = await ScheduledTaskRepository.create(data);
        await this._syncQueueForTask(created);
        return created;
    }

    /**
     * Обновляет запись в БД и синхронизирует соответствующую очередь BullMQ:
     * если крон изменился или задачу отключили - старая репитабл-джоба удаляется,
     * если задача активна - добавляется актуальная.
     */
    async updateTask(id, data) {
        const updated = await ScheduledTaskRepository.update(id, data);
        await this._syncQueueForTask(updated);
        return updated;
    }

    async deleteTask(id) {
        const task = await ScheduledTaskRepository.findById(id);
        if (task) {
            const queue = getQueue(task.queueName);
            const jobId = buildJobId(task);
            const repeatableJobs = await queue.getRepeatableJobs();
            const existingJob = repeatableJobs.find(job => job.id === jobId);
            if (existingJob) {
                await queue.removeRepeatableByKey(existingJob.key);
            }
        }
        return ScheduledTaskRepository.delete(id);
    }
    async _syncQueueForTask(task) {
        const queue = getQueue(task.queueName);
        const jobId = buildJobId(task);
        const repeatableJobs = await queue.getRepeatableJobs();
        
        // Теперь существующая задача будет находиться корректно
        const existingJob = repeatableJobs.find(job => job.id === jobId);

        // Учитываем совместимость версий (Bull использует cron, BullMQ - pattern)
        const currentCron = existingJob ? (existingJob.cron || existingJob.pattern) : null;
        const cronChanged = existingJob && currentCron !== task.cronExpression;

        if (existingJob && (!task.isActive || cronChanged)) {
            await queue.removeRepeatableByKey(existingJob.key);
        }

        if (task.isActive && (!existingJob || cronChanged)) {
            await queue.add(task.jobType, task.payload || {}, {
                jobId, // Оставляем снаружи для обратной совместимости
                repeat: { 
                    cron: task.cronExpression,    // Поддержка Bull
                    pattern: task.cronExpression, // Поддержка BullMQ
                    jobId                         // <--- КРИТИЧНО! Теперь ID привяжется к самому расписанию
                }
            });
        }

        console.log(`[SchedulerService] Задача "${task.taskName}" синхронизирована с очередью "${task.queueName}" (крон: "${task.cronExpression}", активна: ${task.isActive}).`);
    }

    async syncAll() {
        console.log('[SchedulerService] Синхронизация всех расписаний с БД...');

        const dbTasks = await ScheduledTaskRepository.findAll();

        for (const queueName of Object.keys(QUEUE_MAP)) {
            const queue = QUEUE_MAP[queueName];
            const activeTasksForQueue = dbTasks.filter(t => t.queueName === queueName && t.isActive);
            const activeJobIds = new Set(activeTasksForQueue.map(buildJobId));

            const repeatableJobs = await queue.getRepeatableJobs();

            // 1. Удаляем из очереди всё, чего нет (или что отключено) в БД.
            // Благодаря этой логике все твои "зависшие" хэши в Redis очистятся автоматически при старте!
            for (const job of repeatableJobs) {
                if (!activeJobIds.has(job.id)) {
                    await queue.removeRepeatableByKey(job.key);
                    console.log(`[SchedulerService] Удалена лишняя/отключенная джоба из очереди "${queueName}": ${job.id || 'хэш ' + job.key}`);
                }
            }

            // 2. Добавляем/обновляем активные задачи
            const freshRepeatableJobs = await queue.getRepeatableJobs();
            for (const task of activeTasksForQueue) {
                const jobId = buildJobId(task);
                const existingJob = freshRepeatableJobs.find(job => job.id === jobId);

                const currentCron = existingJob ? (existingJob.cron || existingJob.pattern) : null;

                if (existingJob && currentCron === task.cronExpression) {
                    continue; // уже в расписании с нужным кроном
                }

                if (existingJob) {
                    await queue.removeRepeatableByKey(existingJob.key);
                }

                await queue.add(task.jobType, task.payload || {}, {
                    jobId,
                    repeat: { 
                        cron: task.cronExpression,
                        pattern: task.cronExpression,
                        jobId // <--- Важно
                    }
                });
                console.log(`[SchedulerService] Задача "${task.taskName}" добавлена в расписание очереди "${queueName}": "${task.cronExpression}"`);
            }
        }

        console.log('[SchedulerService] Синхронизация расписаний завершена.');
    }

}

module.exports = new SchedulerService();
