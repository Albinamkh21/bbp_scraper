const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class SellerRepository {
  pr
  async upsert(data, tx = prisma) {
    console.log(`[SellerRepository] Сохраняем продавца MerchantID: ${data.merchantId}, Имя: ${data.name}, Рейтинг: ${data.rating}, Отзывы: ${data.reviewsCount}, url: ${data.url}`);
    const sellerData = {
      name: data.name,
      rating: data.rating,
      reviewsCount: data.reviewsCount || 0,
      phone: data.phone || null,
      url: data.url || null
    };

    return await tx.seller.upsert({
      where: {
        marketplaceId_merchantId: {
          marketplaceId: data.marketplaceId,
          merchantId: data.merchantId
        }
      },
      update: sellerData,
      create: {
        marketplaceId: data.marketplaceId,
        merchantId: data.merchantId,
        ...sellerData
      }
    });
  }

  async findByMerchantId(marketplaceId, merchantId, tx = prisma) {
    return await tx.seller.findUnique({
      where: {
        marketplaceId_merchantId: { marketplaceId, merchantId }
      }
    });
  }

  async findWithoutPhone(limit = 20, tx = prisma) {
    return await tx.seller.findMany({
      where: { phone: null },
      take: limit
    });
  }


  async updatePhone(id, phone, tx = prisma) {
    return await tx.seller.update({
      where: { id },
      data: { phone }
    });
  }

}

module.exports = new SellerRepository();