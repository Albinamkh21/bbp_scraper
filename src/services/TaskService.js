// src/services/TaskService.js
const MarketplaceRepository = require('../repositories/MarketplaceRepository');
const TaskRepository = require('../repositories/TaskRepository');
const { scrapingQueue } = require('../core/QueueClient');

class TaskService {
    /**
     * Универсальный метод создания задачи в БД и отправки её в очередь скрапинга
     */
    async createAndQueueTask({ query, marketplace, maxItems, searchType }) {
        const baseUrl = marketplace === 'Kaspi' ? 'https://kaspi.kz' : '';
        
        // 1. Создаем/обновляем маркетплейс
        const mpRecord = await MarketplaceRepository.upsert({ name: marketplace, baseUrl });

        // 2. Создаем задачу в БД
        const task = await TaskRepository.create({
            marketplaceId: mpRecord.id,
            searchType: searchType,
            query: query
        });

        // 3. Пушим реальную задачу на скрапинг в очередь
        await scrapingQueue.add('scrape-job', { 
            taskId: task.id, 
            query, 
            maxItems, 
            searchType 
        }, {
            attempts: 3,
            backoff: { type: 'exponential', delay: 5000 }
        });

        return task;
    }
}

module.exports = new TaskService();