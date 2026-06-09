const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class MarketplaceRepository {
  async findByName(name, tx = prisma) {
    return await tx.marketplace.findUnique({
      where: { name }
    });
  }

  async upsert({ name, baseUrl }, tx = prisma) {
    return await tx.marketplace.upsert({
      where: { name },
      update: { baseUrl },
      create: { name, baseUrl }
    });
  }
}

module.exports = new MarketplaceRepository();