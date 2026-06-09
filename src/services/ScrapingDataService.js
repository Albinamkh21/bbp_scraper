const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const MarketplaceRepository = require('../repositories/MarketplaceRepository');
const BrandRepository = require('../repositories/BrandRepository');
const ProductRepository = require('../repositories/ProductRepository');
const SellerRepository = require('../repositories/SellerRepository');
const PriceHistoryRepository = require('../repositories/PriceHistoryRepository');

class ScrapingDataService {
  /**
   * Главный метод сохранения данных одного товара
   * @param {number} taskId - ID задачи из таблицы search_task (нужно для истории цен)
   * @param {object} scrapedData - Сырые данные от скрапера
   */
  async saveProductData(taskId, scrapedData) {
    if (!scrapedData || !scrapedData.productId) {
      console.warn('[ScrapingDataService] Пустые данные или нет productId (sku), пропускаем.');
      return null;
    }

    // Запускаем единую транзакцию. Если упадет ошибка на сохранении цены — откатится всё.
    return await prisma.$transaction(async (tx) => {
      
      // 1. Ищем или создаем Маркетплейс
      const marketplace = await MarketplaceRepository.upsert({
        name: scrapedData.marketplace,
        baseUrl: 'https://kaspi.kz'
      }, tx);

  
      const extractedBrandName = scrapedData.title ? scrapedData.title.split(' ')[0] : 'Unknown';
      const brand = await BrandRepository.upsert(extractedBrandName, tx);

      // 3. Сохраняем Товар (Product)
      const product = await ProductRepository.upsert({
        marketplaceId: marketplace.id,
        brandId: brand.id,
        sku: scrapedData.productId,              // В скрапере это productId
        title: scrapedData.title,
        url: `https://kaspi.kz/shop/p/-${scrapedData.productId}/`,
        category: scrapedData.category,
        reviewsCount: scrapedData.reviewsCount || 0,
        rating: scrapedData.rating,                            // Скрапер пока не собирает рейтинг товара
        imageUrl: scrapedData.image              // В скрапере это image
      }, tx);

      // 4. Перебираем продавцов и сохраняем их и цены
      if (scrapedData.sellers && scrapedData.sellers.length > 0) {
        for (const sellerData of scrapedData.sellers) {
          
          // Вытаскиваем merchantId из URL продавца (например, .../merchant/123456/)
          let merchantId = 'unknown';
          if (sellerData.url) {
            const idMatch = sellerData.url.match(/merchant\/(\d+)/) || sellerData.url.match(/id=(\d+)/);
            if (idMatch) merchantId = idMatch[1];
          }

          // Если ID не найден, делаем безопасный fallback из имени
          if (merchantId === 'unknown' && sellerData.name) {
             merchantId = `hash_${sellerData.name.replace(/\s+/g, '_')}`;
          }

          // 4.1 Сохраняем Продавца (Seller)
          const seller = await SellerRepository.upsert({
            marketplaceId: marketplace.id,
            merchantId: merchantId,
            name: sellerData.name,
            rating: sellerData.rating,       
            reviewsCount: sellerData.reviewsCount || 0,
            url: sellerData.url || null,
            phone: sellerData.phone || null 
          }, tx);

          // 4.2 Сохраняем Цену (Price History)
          await PriceHistoryRepository.create({
            taskId: taskId,
            productId: product.id,
            sellerId: seller.id,
            price: sellerData.price,
            isAvailable: true
          }, tx);
        }
      }

      return product;
    });
  }
}

module.exports = new ScrapingDataService();