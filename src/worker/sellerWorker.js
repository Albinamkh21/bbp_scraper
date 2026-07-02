// /app/src/worker/sellerWorker.js
const { Worker } = require('bullmq');
const IORedis = require('ioredis'); 
const BrowserManager = require('../core/BrowserManager');
const SellerRepository = require('../repositories/SellerRepository'); 
const KaspiScraper = require('../scrapers/KaspiScraper'); 
const { sellerQueue, SELLER_QUEUE_NAME } = require('../core/QueueClient');
const config = require('../config/appConfig');

// Чистое инлайн-подключение без лишних файлов
const redisConnection = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null
});

const browserManager = new BrowserManager();

const sellerWorker = new Worker(SELLER_QUEUE_NAME, async (job) => {
  console.log(`[Seller Worker] Старт проверки продавцов по расписанию. Job ID: ${job.id}`);

  const batchSize = config.scraping.schedules.sellersPerBatch || 15;
  const sellersToUpdate = await SellerRepository.findWithoutPhone(batchSize);

  if (sellersToUpdate.length === 0) {
    console.log('[Seller Worker] Все продавцы уже имеют телефоны. Отдыхаем.');
    return;
  }

  const { browser, page } = await browserManager.createSession();

  try {
    for (const seller of sellersToUpdate) {
      if (!seller.url) continue;

      console.log(`[Seller Worker] Отправляем в KaspiScraper продавца: ${seller.name}`);
      
      const phone = await KaspiScraper.parseSellerPhone(page, seller.url);

      if (phone) {
        await SellerRepository.updatePhone(seller.id, phone);
        console.log(`   ✓ Успешно сохранен телефон для ${seller.name}: ${phone}`);
      } else {
        await SellerRepository.updatePhone(seller.id, 'not_found');
        console.log(`   ? Телефон для ${seller.name} не найден. Установлен маркер 'not_found'`);
      }

      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  } catch (workerError) {
    
    console.error('[Seller Worker ERROR] Ошибка внутри цикла обработки:', workerError);
  } finally {
    await browser.close();
  } 


}, { connection: redisConnection,
    concurrency: 1  ,
    lockDuration: 600000
 });

module.exports = sellerWorker;