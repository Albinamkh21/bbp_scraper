const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class UserRepository {
  async findByEmail(email) {
    return await prisma.user.findUnique({
      where: { email },
      include: { role: true }
    });
  }

  async findRoleByName(name) {
    return await prisma.role.findUnique({
      where: { name }
    });
  }

  async createUser(email, passwordHash, name, roleId) {
    return await prisma.user.create({
      data: { email, passwordHash, name, roleId },
      include: { role: true }
    });
  }

  async saveRefreshToken(token, userId, expiresAt) {
    return await prisma.refreshToken.create({
      data: { token, userId, expiresAt }
    });
  }

  async findRefreshToken(token) {
    return await prisma.refreshToken.findUnique({
      where: { token },
      include: { user: { include: { role: true } } }
    });
  }

  async deleteRefreshToken(token) {
    return await prisma.refreshToken.delete({
      where: { token }
    });
  }
}

module.exports = new UserRepository();