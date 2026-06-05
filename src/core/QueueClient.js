// src/core/QueueClient.js
const { Queue } = require('bullmq');
const config = require('../config/appConfig');

const SCRAPING_QUEUE_NAME = 'scraping-tasks';

const scrapingQueue = new Queue(SCRAPING_QUEUE_NAME, {
    connection: { url: config.redis.url }
});

module.exports = {
    scrapingQueue,
    SCRAPING_QUEUE_NAME
};