const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();
const config = require('../config/appConfig');

chromium.use(stealth);

class BrowserManager {
  async createSession() {
    const browser = await chromium.launch({
      headless: process.env.HEADLESS ? process.env.HEADLESS !== 'false' : config.browser.headless,
      args: config.browser.args
    });

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