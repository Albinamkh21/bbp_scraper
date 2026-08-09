const fs = require('fs').promises;
const path = require('path');
const nodemailer = require('nodemailer');

const sendVerificationEmail = async (email, token) => {
    const verificationLink = `${process.env.FRONTEND_URL}/?token=${token}`;
    
    const subject = 'Подтверждение регистрации BBP';
    const htmlContent = `
        <div style="font-family: sans-serif; padding: 20px;">
            <h2>Добро пожаловать!</h2>
            <p>Пожалуйста, подтвердите ваш email, перейдя по ссылке ниже:</p>
            <a href="${verificationLink}" style="background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                Подтвердить Email
            </a>
            <p style="margin-top: 20px; font-size: 12px; color: #666;">
                Если кнопка не работает, скопируйте эту ссылку в браузер:<br>
                ${verificationLink}
            </p>
        </div>
    `;

    // 1. РЕЖИМ РАЗРАБОТКИ: Сохраняем в папку /logs/emails
    if (process.env.EMAIL_MODE === 'file') {
        try {
            // Создаем папку, если ее нет (в корне проекта)
            const dir = path.join(__dirname, '../../logs/emails');
            await fs.mkdir(dir, { recursive: true });

            // Формируем имя файла (например: 16849302_albinamkh@mail.ru.html)
            const filename = `${Date.now()}_${email}.html`;
            const filePath = path.join(dir, filename);

            await fs.writeFile(filePath, htmlContent);
            console.log(`[EMAIL MOCK] Письмо для ${email} сохранено в файл: logs/emails/${filename}`);
            return;
        } catch (err) {
            console.error('[EMAIL MOCK ERROR] Ошибка при сохранении письма:', err);
        }
    }

    // 2. БОЕВОЙ РЕЖИМ: Отправляем через nodemailer (пока просто заготовка)
    if (process.env.EMAIL_MODE === 'smtp') {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        await transporter.sendMail({
            from: '"BBP Project" <noreply@bbp.kz>',
            to: email,
            subject: subject,
            html: htmlContent,
        });
        console.log(`[EMAIL] Письмо успешно отправлено на ${email}`);
    }
};

const sendPasswordResetEmail = async (email, token) => {
    const resetLink = `${process.env.FRONTEND_URL}/?resetToken=${token}`;
    const subject = 'Сброс пароля BBP';
    const htmlContent = `
        <div style="font-family: sans-serif; padding: 20px;">
            <h2>Сброс пароля</h2>
            <p>Чтобы изменить пароль, перейдите по ссылке ниже:</p>
            <a href="${resetLink}" style="background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                Сбросить пароль
            </a>
            <p style="margin-top: 20px; font-size: 12px; color: #666;">
                Если кнопка не работает, скопируйте эту ссылку в браузер:<br>
                ${resetLink}
            </p>
        </div>
    `;

    if (process.env.EMAIL_MODE === 'file') {
        try {
            const dir = path.join(__dirname, '../../logs/emails');
            await fs.mkdir(dir, { recursive: true });
            const filename = `${Date.now()}_${email}_reset.html`;
            const filePath = path.join(dir, filename);
            await fs.writeFile(filePath, htmlContent);
            console.log(`[EMAIL MOCK] Письмо для ${email} сохранено в файл: logs/emails/${filename}`);
            return;
        } catch (err) {
            console.error('[EMAIL MOCK ERROR] Ошибка при сохранении письма:', err);
        }
    }

    if (process.env.EMAIL_MODE === 'smtp') {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        await transporter.sendMail({
            from: '"BBP Project" <noreply@bbp.kz>',
            to: email,
            subject: subject,
            html: htmlContent,
        });
        console.log(`[EMAIL] Письмо успешно отправлено на ${email}`);
    }
};

module.exports = { sendVerificationEmail, sendPasswordResetEmail };