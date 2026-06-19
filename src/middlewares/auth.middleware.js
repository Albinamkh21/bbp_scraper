// src/middlewares/auth.middleware.js
const jwt = require('jsonwebtoken');

const protect = async (req, res, next) => {
    let token;

    // 1. Проверяем наличие заголовка Authorization и то, что он начинается с Bearer
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Извлекаем чистый токен из строки "Bearer TOKEN_STRING"
            token = req.headers.authorization.split(' ')[1];

            // ВАЖНО: используем именно JWT_ACCESS_SECRET, как в твоем .env
            const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

            // Записываем данные пользователя из токена в объект запроса, чтобы использовать дальше
            req.user = {
                id: decoded.userId,
                role: decoded.role
            };

            return next(); // Всё отлично, пропускаем к роуту
        } catch (error) {
            console.error('[AUTH ERROR] Ошибка верификации токена:', error.message);
            return res.status(401).json({ error: 'Not authorized, token invalid or expired' });
        }
    }

    // 2. Если токена вообще нет в заголовках
    if (!token) {
        return res.status(401).json({ error: 'Not authorized, no token provided' });
    }
};

module.exports = { protect };