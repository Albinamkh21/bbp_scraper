// src/core/Database.js
const { Pool } = require('pg');
const config = require('../config/appConfig');

const pool = new Pool({
    connectionString: config.database.url,
});

// Экспортируем метод query для защиты от утечек соединений
module.exports = {
    query: (text, params) => pool.query(text, params),
    pool
};