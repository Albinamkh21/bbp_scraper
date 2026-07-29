// src/schedulers/BootstrapScheduler.js
// Единая точка инициализации расписаний при старте приложения.
// Заменяет собой раздельные вызовы initScheduler() (sellerScheduler.js) и
// initScrapingScheduler() (scrapingScheduler.js) - вся их логика теперь живёт
// в SchedulerService, а источником правды является таблица scheduled_tasks в БД.
// Старые файлы намеренно не удалены (оставлены как есть).
const schedulerService = require('../services/SchedulerService');

async function bootstrapSchedulers() {
    console.log('[BootstrapScheduler] Запуск инициализации расписаний...');
    await schedulerService.syncAll();
    console.log('[BootstrapScheduler] Инициализация расписаний завершена.');
}

module.exports = { bootstrapSchedulers };
