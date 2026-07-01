// src/core/QueueClient.js
const { Queue } = require('bullmq');
const config = require('../config/appConfig');

const SCRAPING_QUEUE_NAME = 'scraping-tasks';
const SELLER_QUEUE_NAME = 'seller-details-queue';

const scrapingQueue = new Queue(SCRAPING_QUEUE_NAME, {
    connection: { url: config.redis.url }
});

const sellerQueue = new Queue(SELLER_QUEUE_NAME, {
    connection: { url: config.redis.url }
});

module.exports = {
    scrapingQueue,
    sellerQueue,
    SCRAPING_QUEUE_NAME, 
    SELLER_QUEUE_NAME
};