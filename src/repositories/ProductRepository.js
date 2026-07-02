const { PrismaClient } = require('@prisma/client');
const CategoryRepository = require('./CategoryRepository');
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

  async assignCategoryIdsToProducts(tx = prisma) {
    const productsWithoutCategory = await tx.product.findMany({
      where: {
        OR: [{ categoryId: null }, { categoryId: '' }]
      },
      select: {
        id: true,
        rawCategories: true
      }
    });

    let updatedCount = 0;

    for (const product of productsWithoutCategory) {
      const categoryPath = CategoryRepository.normalizeCategoryPath(product.rawCategories);
      const categoryId = await CategoryRepository.ensureCategoryPath(categoryPath, tx);

      if (categoryId) {
        await tx.product.update({
          where: { id: product.id },
          data: { categoryId }
        });
        updatedCount += 1;
      }
    }

    return updatedCount;
  }
}

module.exports = new ProductRepository();