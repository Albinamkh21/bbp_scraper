const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/UserRepository');

class AuthService {
  async register({ email, password, name }) {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    const candidate = await userRepository.findByEmail(email);
    if (candidate) {
      throw new Error('User with this email already exists');
    }

    const defaultRole = await userRepository.findRoleByName('USER');
    if (!defaultRole) {
      throw new Error('Default role not found');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await userRepository.createUser(email, passwordHash, name, defaultRole.id);

    return { id: user.id, email: user.email, role: user.role.name };
  }

  async login({ email, password }) {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    const tokens = this.generateTokens({ userId: user.id, role: user.role.name });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    await userRepository.saveRefreshToken(tokens.refreshToken, user.id, expiresAt);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: { id: user.id, email: user.email, role: user.role.name }
    };
  }

  generateTokens(payload) {
    const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: '30d' });
    return { accessToken, refreshToken };
  }
}

module.exports = new AuthService();