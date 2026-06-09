const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();
const config = require('../config/appConfig');

chromium.use(stealth);

class BrowserManager {
  async createSession() {


    const launchOptions = {
        headless: process.env.HEADLESS ? process.env.HEADLESS !== 'false' : config.browser.headless,
        args: config.browser.args
    };
    

    if (config.proxy && config.proxy.enabled && config.proxy.server) {
        console.log(`[BrowserManager] 🛡️ Инициализация через ПРОКСИ: ${config.proxy.server}`);
        launchOptions.proxy = {
            server: config.proxy.server,
            username: config.proxy.username,
            password: config.proxy.password
        };
    } else {
        console.log('[BrowserManager] 🌐 Прокси отключен. ПРЯМОЕ подключение.');
    }

    const browser = await chromium.launch(launchOptions);

    const context = await browser.newContext({
      viewport: config.browser.viewport,
      userAgent: config.browser.userAgent,
      locale: config.browser.locale,
      timezoneId: config.browser.timezoneId
    });




    const page = await context.newPage();
    return { browser, context, page };
  }
}

module.exports = BrowserManager;