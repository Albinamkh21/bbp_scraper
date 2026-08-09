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

  async findAll(filters = {}, tx = prisma) {
    const where = {};

    if (filters.query) {
      where.query = { contains: filters.query, mode: 'insensitive' };
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom);
      if (filters.dateTo) {
        const dateTo = new Date(filters.dateTo);
        dateTo.setHours(23, 59, 59, 999);
        where.createdAt.lte = dateTo;
      }
    }

    return await tx.searchTask.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
  }
}


module.exports = new TaskRepository();