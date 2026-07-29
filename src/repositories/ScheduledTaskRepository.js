const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class ScheduledTaskRepository {
  async findAll(tx = prisma) {
    return tx.scheduledTask.findMany({ orderBy: { id: 'asc' } });
  }

  async findActive(tx = prisma) {
    return tx.scheduledTask.findMany({ where: { isActive: true } });
  }

  async findById(id, tx = prisma) {
    return tx.scheduledTask.findUnique({ where: { id: Number(id) } });
  }

  async create(data, tx = prisma) {
    return tx.scheduledTask.create({
      data: {
        taskName: data.taskName,
        queueName: data.queueName,
        jobType: data.jobType,
        cronExpression: data.cronExpression,
        isActive: data.isActive ?? true,
        payload: data.payload ?? {}
      }
    });
  }

  async update(id, data, tx = prisma) {
    const updateData = {};
    if (data.taskName !== undefined) updateData.taskName = data.taskName;
    if (data.queueName !== undefined) updateData.queueName = data.queueName;
    if (data.jobType !== undefined) updateData.jobType = data.jobType;
    if (data.cronExpression !== undefined) updateData.cronExpression = data.cronExpression;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.payload !== undefined) updateData.payload = data.payload;

    return tx.scheduledTask.update({
      where: { id: Number(id) },
      data: updateData
    });
  }

  async delete(id, tx = prisma) {
    return tx.scheduledTask.delete({ where: { id: Number(id) } });
  }
}

module.exports = new ScheduledTaskRepository();
