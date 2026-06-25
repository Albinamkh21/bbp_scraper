const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const UserRepository = require('../repositories/UserRepository'); // Подключаем репозиторий
const { sendVerificationEmail, sendPasswordResetEmail } = require('./EmailService');

class AuthService {
    
    // === РЕГИСТРАЦИЯ ===
    static async register(data) {
        const { name, email, password, confirmPassword } = data;

        if (!email || !password || !confirmPassword) {
            throw new Error('Все поля обязательны для заполнения');
        }
        if (password !== confirmPassword) {
            throw new Error('Пароли не совпадают');
        }

        // Проверка через репозиторий
        const existingUser = await UserRepository.findByEmail(email);
        if (existingUser) {
            throw new Error('Пользователь с таким email уже существует');
        }

        // Ищем роль по умолчанию (например, USER)
        let role = await UserRepository.findRoleByName('USER');
        if (!role) {
            throw new Error('Роль по умолчанию не найдена в системе');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationToken = crypto.randomBytes(32).toString('hex');

        // Создаем через репозиторий
        const newUser = await UserRepository.createUser(
            email, 
            hashedPassword, 
            name, 
            role.id, 
            verificationToken
        );

        // Отправка письма
        await sendVerificationEmail(newUser.email, verificationToken);

        return { 
            success: true, 
            message: 'Регистрация успешна. Проверьте почту для подтверждения.' 
        };
    }

    // === ЛОГИН ===
    static async login(data) {
        const { email, password } = data;

        const user = await UserRepository.findByEmail(email);
        if (!user) {
            throw new Error('Неверный email или пароль');
        }

        const isValidPassword = await bcrypt.compare(password, user.passwordHash); // используем passwordHash, как в твоем репозитории
        if (!isValidPassword) {
            throw new Error('Неверный email или пароль');
        }

        // Защита: проверка подтверждения почты
        if (!user.isVerified) {
            throw new Error('Пожалуйста, подтвердите вашу электронную почту перед входом.');
        }

        const accessToken = jwt.sign(
            { userId: user.id, role: user.role?.name || 'USER' },
            process.env.JWT_ACCESS_SECRET,
            { expiresIn: '15m' }
        );

        const refreshToken = jwt.sign(
            { userId: user.id },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: '30d' }
        );

        // Сохраняем refresh токен через репозиторий
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        await UserRepository.saveRefreshToken(refreshToken, user.id, expiresAt);

        return { 
            accessToken, 
            refreshToken, 
            user: { id: user.id, name: user.name, email: user.email, role: user.role?.name } 
        };
    }

    // === ПОДТВЕРЖДЕНИЕ ПОЧТЫ ===
    static async verifyEmail(token) {
        if (!token) {
            throw new Error('Токен отсутствует');
        }

        // Поиск токена через репозиторий
        const user = await UserRepository.findByVerificationToken(token);
        if (!user) {
            throw new Error('Неверный или устаревший токен подтверждения');
        }

        // Обновление статуса через репозиторий
        await UserRepository.verifyUserEmail(user.id);

        return { 
            success: true, 
            message: 'Email успешно подтвержден. Теперь вы можете войти.' 
        };
    }

    static async forgotPassword(data) {
        const { email } = data;

        if (!email) {
            throw new Error('Email обязателен');
        }

        const user = await UserRepository.findByEmail(email);

        // Всегда возвращаем одинаковое сообщение, чтобы не выдавать, существует ли email
        if (!user) {
            return {
                success: true,
                message: 'Если этот email зарегистрирован, ссылка для восстановления будет отправлена.'
            };
        }

        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 час

        await UserRepository.deletePasswordResetTokensByUserId(user.id);
        await UserRepository.createPasswordResetToken(user.id, token, expiresAt);
        await sendPasswordResetEmail(user.email, token);

        return {
            success: true,
            message: 'Если этот email зарегистрирован, ссылка для восстановления будет отправлена.'
        };
    }

    static async resetPassword(data) {
        const { token, password, confirmPassword } = data;

        if (!token || !password || !confirmPassword) {
            throw new Error('Все поля обязательны для заполнения');
        }

        if (password !== confirmPassword) {
            throw new Error('Пароли не совпадают');
        }

        if (password.length < 6) {
            throw new Error('Пароль должен быть не менее 6 символов');
        }

        const resetToken = await UserRepository.findByPasswordResetToken(token);
        if (!resetToken || resetToken.expiresAt < new Date()) {
            throw new Error('Неверный или просроченный токен сброса пароля');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await UserRepository.updatePasswordHash(resetToken.userId, hashedPassword);
        await UserRepository.deletePasswordResetTokensByUserId(resetToken.userId);

        return {
            success: true,
            message: 'Пароль успешно изменен. Теперь вы можете войти.'
        };
    }
}

module.exports = AuthService;