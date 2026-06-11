const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class TaskRepository {
  async create({ marketplaceId, searchType, query }, tx = prisma) {
    return await tx.searchTask.create({
      data: {
        marketplaceId,
        searchType,
        query,
        status: 'pending'
      }
    });
  }

  async updateStatus(id, status, tx = prisma) {
    return await tx.searchTask.update({
      where: { id },
      data: { status }
    });
  }

  async findById(id, tx = prisma) {
    return await tx.searchTask.findUnique({
      where: { id }
    });
  }

  async findAll(tx = prisma) {
    return await tx.searchTask.findMany({
      orderBy: {
        createdAt: 'desc' // Сначала показываем самые последние запуски
      }
    });
  }
}


module.exports = new TaskRepository();