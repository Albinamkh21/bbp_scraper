const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class ProductRepository {
  async upsert(data, tx = prisma) {
   console.log(`[ProductRepository] Сохраняем продукт SKU: ${data.sku}, Рейтинг: ${data.rating}, Отзывы: ${data.reviewsCount}, rawCategories: ${data.rawCategories ? data.rawCategories.join(' > ') : 'N/A'}`);
    
    try {
      return await tx.product.upsert({
        where: {
          marketplaceId_sku: {
            marketplaceId: data.marketplaceId,
            sku: data.sku
          }
        },
        update: {
          url: data.url,
          title: data.title,
         
          rawCategories: data.rawCategories || [], 
          categoryId: data.categoryId !== undefined ? data.categoryId : undefined,
          reviewsCount: data.reviewsCount,
          rating: data.rating,
          imageUrl: data.imageUrl
        },
        create: {
          marketplaceId: data.marketplaceId,
          brandId: data.brandId,
          sku: data.sku,
          url: data.url,
          title: data.title,

          rawCategories: data.rawCategories || [], 
      
          categoryId: data.categoryId || null,
          reviewsCount: data.reviewsCount,
          rating: data.rating,
          imageUrl: data.imageUrl
        }
      });
    } catch (error) {
      console.error(`[ProductRepository ERROR] Не удалось сохранить ${data.sku}:`, error.message);
      throw error;
    }
  }

  async findBySku(marketplaceId, sku, tx = prisma) {
    return await tx.product.findUnique({
      where: {
        marketplaceId_sku: { marketplaceId, sku }
      }
    });
  }
}

module.exports = new ProductRepository();