const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class PriceHistoryRepository {
  async create(data, tx = prisma) {
    console.log('[PriceHistoryRepository] Создаем запись истории цены:', data.productId, data.deliveryInfo );
    return await tx.priceHistory.create({
      data: {
        taskId: data.taskId,
        productId: data.productId,
        sellerId: data.sellerId,
        price: data.price,
        isAvailable: data.isAvailable ?? true,
        deliveryRaw: data.deliveryInfo || null,
        deliveryDays: data.deliveryDays || null
      }
    });
  }

  async findByProductId(productId, tx = prisma) {
    return await tx.priceHistory.findMany({
      where: { productId },
      orderBy: { scannedAt: 'desc' }
    });
  }
  
  async getProductsByTaskId(taskId) {
       
        const historyRecords = await prisma.priceHistory.findMany({
            where: { taskId: parseInt(taskId, 10) },
            distinct: ['productId'],
            include: {
                product: true
            }
        });

     
        return historyRecords.map(record => record.product).filter(Boolean);
    }

 
  async getSellersByTaskAndProduct(taskId, productId) {
        return await prisma.priceHistory.findMany({
            where: {
                taskId: parseInt(taskId, 10),
                productId: parseInt(productId, 10)
            },
            include: {
                seller: true, 
                product:{
                  include: {
                    marketplace: true 
                }}
            },
            orderBy: {
                price: 'asc' 
            }
        });
    }



}

module.exports = new PriceHistoryRepository();