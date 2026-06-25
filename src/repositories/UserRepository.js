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

async createUser(email, passwordHash, name, roleId, verificationToken) {
  return await prisma.user.create({
    data: { 
      email, 
      passwordHash, 
      name, 
      roleId, 
      verificationToken // <-- Теперь токен успешно сохраняется в базу!
    },
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

  async findByVerificationToken(token) {
    return await prisma.user.findFirst({
      where: { verificationToken: token }
    });
  }

  async createPasswordResetToken(userId, token, expiresAt) {
    return await prisma.passwordResetToken.create({
      data: {
        userId,
        token,
        expiresAt
      }
    });
  }

  async findByPasswordResetToken(token) {
    return await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true }
    });
  }

  async deletePasswordResetTokensByUserId(userId) {
    return await prisma.passwordResetToken.deleteMany({
      where: { userId }
    });
  }

  async updatePasswordHash(userId, passwordHash) {
    return await prisma.user.update({
      where: { id: userId },
      data: { passwordHash }
    });
  }

  async verifyUserEmail(userId) {
    return await prisma.user.update({
      where: { id: userId },
      data: {
        isVerified: true,
        verificationToken: null // Очищаем использованный токен
      }
    });
  }
}

module.exports = new UserRepository();