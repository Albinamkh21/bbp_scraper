const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testSave() {
  try {
    // 1. Создаем (или находим) маркетплейс
    const marketplace = await prisma.marketplace.upsert({
      where: { name: 'Kaspi' },
      update: {},
      create: { name: 'Kaspi', baseUrl: 'https://kaspi.kz' }
    });

    // 2. Создаем бренд
    const brand = await prisma.brand.upsert({
      where: { name: 'Roborock' },
      update: {},
      create: { name: 'Roborock' }
    });

    // 3. Создаем товар
    const product = await prisma.product.upsert({
      where: { marketplaceId_sku: { marketplaceId: marketplace.id, sku: '12345' } },
      update: { title: 'Roborock S8' },
      create: {
        marketplaceId: marketplace.id,
        brandId: brand.id,
        sku: '12345',
        title: 'Roborock S8'
      }
    });

    console.log('✅ Данные успешно записаны в базу:', { product: product.title });
  } catch (error) {
    console.error('❌ Ошибка записи:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSave();