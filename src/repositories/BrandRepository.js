const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class BrandRepository {
  async findByName(name, tx = prisma) {
    return await tx.brand.findUnique({
      where: { name }
    });
  }

  async upsert(name, tx = prisma) {
    return await tx.brand.upsert({
      where: { name },
      update: {},
      create: { name }
    });
  }
}

module.exports = new BrandRepository();