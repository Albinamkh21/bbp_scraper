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




  async updateEmptyDeliveryDays() {
        
          const records = await prisma.priceHistory.findMany({
              where: {
                  deliveryDays: null,
                  NOT: {
                      deliveryRaw: null
                  }
              }
          });

          let updatedCount = 0;

          const months = {
              'янв': 0, 'фев': 1, 'мар': 2, 'апр': 3, 'май': 4, 'мая': 4,
              'июн': 5, 'июл': 6, 'авг': 7, 'сен': 8, 'окт': 9, 'ноя': 10, 'дек': 11
          };

          for (const record of records) {
              const baseDate = new Date(record.scannedAt);
              if (isNaN(baseDate.getTime())) continue;

           
              const options = record.deliveryRaw.split('|');
              let minDays = null;

              for (const option of options) {
                  const lowerStr = option.toLowerCase().trim();
                  let currentDays = null;

                  if (lowerStr.includes('сегодня')) {
                      currentDays = 0;
                  } else if (lowerStr.includes('завтра')) {
                      currentDays = 1;
                  } else {
                      const match = lowerStr.match(/(\d+)\s+([а-яё]+)/);
                      if (match) {
                          const day = parseInt(match[1], 10);
                          const monthName = match[2].substring(0, 3);

                          if (months[monthName] !== undefined) {
                              const targetMonth = months[monthName];
                              let targetYear = baseDate.getFullYear();

                              // Обработка перехода года (сканировали в декабре, доставка в январе)
                              if (targetMonth === 0 && baseDate.getMonth() === 11) {
                                  targetYear += 1;
                              }

                              const d1 = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
                              const d2 = new Date(targetYear, targetMonth, day);

                              const diffTime = d2.getTime() - d1.getTime();
                              const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
                              currentDays = diffDays >= 0 ? diffDays : 0;
                          }
                      }
                  }

                  if (currentDays !== null) {
                      if (minDays === null || currentDays < minDays) {
                          minDays = currentDays;
                      }
                  }
              }

            
              if (minDays !== null) {
                  await prisma.priceHistory.update({
                      where: { id: record.id },
                      data: { deliveryDays: minDays }
                  });
                  updatedCount++;
              }
          }

          return updatedCount;
  }
}
module.exports = new PriceHistoryRepository();