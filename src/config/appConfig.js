require('dotenv').config();

module.exports = {
  browser: {
    headless: true,
    viewport: { width: 1400, height: 900 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    locale: 'ru-RU',
    timezoneId: 'Asia/Almaty',
    args: [
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox',
      '--disable-web-security',
      '--disable-setuid-sandbox'
    ]
  },
  scraping: {
    defaultQuery: 'apple iphone 15',
    timeouts: {
      navigation: 60000,
      selector: 30000
    },
    delays: {
      searchMin: 2000,
      searchMax: 5000,
      productMin: 1500,
      productMax: 3000,
      iterationMin: 1000,
      iterationMax: 2000
    },
    schedules: {
      // '*/1 * * * *' — означает "каждую минуту" для теста
      // В продакшене поменяешь на '0 * * * *' (каждый час) или '0 2 * * *' (ночью в 2:00)
      sellerPhones: process.env.SELLER_CRON || '0 2 * * *' 
    }
  },
  app: {
        env: process.env.NODE_ENV || 'development',
        port: process.env.APP_PORT || 3000,
        host: process.env.APP_HOST || '0.0.0.0'
    },
  database: {
        url: process.env.DATABASE_URL
    },
  redis: {
        url: process.env.REDIS_URL
    },
  proxy: {
    enabled: process.env.USE_PROXY === 'true', 
    server: process.env.PROXY_SERVER || '',
    username: process.env.PROXY_USERNAME || '',
    password: process.env.PROXY_PASSWORD || '',
    changeIpUrl: process.env.PROXY_CHANGE_IP_URL || ''
  },
 
};