// src/services/BroadcastService.js
const Redis = require('ioredis');
const config = require('../config/appConfig');

class BroadcastService {
  constructor() {
    this.redis = null;
    this.isConnected = false;
  }

  /**
   * Инициализация подключения к Redis
   */
  async connect() {
    if (this.isConnected) return;

    try {
      this.redis = new Redis(config.redis.url);
      
      this.redis.on('connect', () => {
        this.isConnected = true;
        console.log('[BroadcastService] Подключено к Redis');
      });

      this.redis.on('error', (err) => {
        console.error('[BroadcastService] Ошибка Redis:', err.message);
        this.isConnected = false;
      });

      await this.redis.ping();
    } catch (error) {
      console.error('[BroadcastService] Не удалось подключиться к Redis:', error.message);
      this.isConnected = false;
    }
  }

  /**
   * Публикация лог-сообщения в Redis канал
   * @param {string} taskId - ID задачи
   * @param {string} message - Текст сообщения
   * @param {string} level - Уровень логирования (info, error, warn, success)
   */
  async publishLog(taskId, message, level = 'info') {
    if (!this.isConnected || !this.redis) {
      // Если нет подключения к Redis, молча пропускаем
      return;
    }

    try {
      const logData = {
        taskId,
        message,
        level,
        timestamp: new Date().toISOString()
      };

      const channel = `task:${taskId}:logs`;
      await this.redis.publish(channel, JSON.stringify(logData));
    } catch (error) {
      // Логируем ошибку, но не прерываем основной процесс
      console.error('[BroadcastService] Ошибка при публикации лога:', error.message);
    }
  }

  /**
   * Закрытие подключения к Redis
   */
  async disconnect() {
    if (this.redis) {
      await this.redis.quit();
      this.isConnected = false;
      console.log('[BroadcastService] Отключено от Redis');
    }
  }
}

// Экспортируем singleton
const broadcastService = new BroadcastService();
module.exports = broadcastService;
