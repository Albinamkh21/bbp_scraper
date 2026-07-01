
const  MarketplaceRepository = require('../../repositories/MarketplaceRepository');
const  TaskRepository  = require('../../repositories/TaskRepository');
const { scrapingQueue } = require('../../core/QueueClient');



const createTask = async (req, res, next) => {

    try {
        const { query, marketplace = 'Kaspi', maxItems = 12 , searchType = 'query' } = req.body;
        if (!query) return res.status(400).json({ error: 'Параметр query обязателен' });


        const baseUrl = marketplace === 'Kaspi' ? 'https://kaspi.kz' : '';
        const mpRecord = await MarketplaceRepository.upsert({ name: marketplace, baseUrl });

        const task = await TaskRepository.create({
            marketplaceId: mpRecord.id,
            searchType: searchType,
            query
        });

        await scrapingQueue.add('scrape-job', { taskId: task.id, query, maxItems, searchType }, {
            attempts: 3,
            backoff: { type: 'exponential', delay: 5000 }
        });

        return res.status(202).json({ taskId: task.id, status: 'pending' });
    } catch (error) {
        next(error);
    }
};

module.exports = { createTask };