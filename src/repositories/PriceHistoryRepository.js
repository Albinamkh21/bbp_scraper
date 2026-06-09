const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class PriceHistoryRepository {
  async create(data, tx = prisma) {
    return await tx.priceHistory.create({
      data: {
        taskId: data.taskId,
        productId: data.productId,
        sellerId: data.sellerId,
        price: data.price,
        isAvailable: data.isAvailable ?? true
      }
    });
  }

  async findByProductId(productId, tx = prisma) {
    return await tx.priceHistory.findMany({
      where: { productId },
      orderBy: { scannedAt: 'desc' }
    });
  }
}

module.exports = new PriceHistoryRepository();