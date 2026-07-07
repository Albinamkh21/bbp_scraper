const taskService = require('../../services/TaskService');

const createTask = async (req, res, next) => {
    try {
        const { query, marketplace = 'Kaspi', maxItems = 12 , searchType = 'query' } = req.body;
        if (!query) return res.status(400).json({ error: 'Параметр query обязателен' });

     
        const task = await taskService.createAndQueueTask({ query, marketplace, maxItems, searchType });

        return res.status(202).json({ taskId: task.id, status: 'pending' });
    } catch (error) {
        next(error);
    }
};

module.exports = { createTask };