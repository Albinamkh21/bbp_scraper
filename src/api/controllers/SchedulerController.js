// src/api/controllers/SchedulerController.js
const schedulerService = require('../../services/SchedulerService');

const getSchedules = async (req, res, next) => {
    try {
        const tasks = await schedulerService.getAll();
        return res.json(tasks);
    } catch (error) {
        next(error);
    }
};

const updateSchedule = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { taskName, cronExpression, isActive, payload } = req.body;

        const updated = await schedulerService.updateTask(id, { taskName, cronExpression, isActive, payload });
        return res.json(updated);
    } catch (error) {
        next(error);
    }
};

const toggleSchedule = async (req, res, next) => {
    try {
        const { id } = req.params;
        const task = await schedulerService.getById(id);
        if (!task) return res.status(404).json({ error: 'Задача не найдена' });

        const updated = await schedulerService.updateTask(id, { isActive: !task.isActive });
        return res.json(updated);
    } catch (error) {
        next(error);
    }
};

module.exports = { getSchedules, updateSchedule, toggleSchedule };
