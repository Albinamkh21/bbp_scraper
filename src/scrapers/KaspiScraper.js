const BaseScraper = require('./BaseScraper');
const config = require('../config/appConfig');


class KaspiScraper extends BaseScraper {
  async delay(min, max) {
    const ms = Math.floor(Math.random() * (max - min + 1)) + min;
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async search(page, query) {
    console.log('[KaspiScraper] Открытие главной страницы Kaspi...');
    await page.goto('https://kaspi.kz/shop/', {
      waitUntil: 'domcontentloaded',
      timeout: config.scraping.timeouts.navigation
    });
    await this.delay(config.scraping.delays.searchMin, config.scraping.delays.searchMax);

    const searchUrl = `https://kaspi.kz/shop/search/?text=${encodeURIComponent(query)}&sort=relevance`;
    console.log(`[KaspiScraper] Переход на страницу поиска...`);
    
    await page.goto(searchUrl, {
      waitUntil: 'domcontentloaded',
      timeout: config.scraping.timeouts.navigation
    });
    await this.delay(config.scraping.delays.searchMin, config.scraping.delays.searchMax);

    await page.waitForSelector('a[href*="/shop/p/"]', { timeout: config.scraping.timeouts.selector });

    const productUrls = await page.$$eval('a[href*="/shop/p/"]', links => {
      const seen = new Set();
      const result = [];
      for (const a of links) {
        if (!a.href) continue;
        try {
          const url = new URL(a.href);
          const cleanUrl = url.origin + url.pathname.replace(/\/$/, '');
          if (!seen.has(cleanUrl)) {
            seen.add(cleanUrl);
            result.push(cleanUrl);
          }
        } catch (e) {}
      }
      return result;
    });

    if (!productUrls.length) {
      throw new Error('Товары не найдены по запросу');
    }

    return productUrls;
  }

  async parseProduct(page, url) {
    await this.delay(config.scraping.delays.productMin, config.scraping.delays.productMax);
    await page.goto(url, { 
      waitUntil: 'domcontentloaded', 
      timeout: config.scraping.timeouts.navigation 
    });
    
    await page.waitForSelector('h1', { timeout: config.scraping.timeouts.selector });
    await this.delay(config.scraping.delays.productMin, config.scraping.delays.productMax);

    const extractedData = await page.evaluate((productUrl) => {
      const productId = productUrl.match(/-(\d+)\/?$/)?.[1] || null;
      const title = document.querySelector('h1')?.textContent?.trim() || null;
      
      const reviewsMatch = document.body.innerText.match(/\((\d+)\s*отзыв/i);
      const reviewsCount = reviewsMatch ? parseInt(reviewsMatch[1], 10) : null;

      let category = null;
      document.querySelectorAll('a').forEach(link => {
        if (link.href?.includes('/shop/c/') || link.href?.includes('/c/')) {
          category = link.textContent?.trim();
        }
      });

      const image = document.querySelector('img[src*="resources.cdn"]')?.src || null;
      const sellers = [];
      const rows = document.querySelectorAll('tr');

      for (const row of rows) {
        const cells = row.querySelectorAll('td');
        if (cells.length < 3) continue;

        let sellerName = null;
        let sellerUrl = null;
        const links = cells[0]?.querySelectorAll('a') || [];

        for (const link of links) {
          if (link.href?.includes('merchant')) {
            sellerName = link.textContent?.trim();
            sellerUrl = link.href;
            break;
          }
        }

        if (!sellerName && links.length > 0) {
          sellerName = links[0].textContent?.trim();
          sellerUrl = links[0].href;
        }

        let price = null;
        for (const cell of cells) {
          const text = cell.textContent || '';
          const prices = text.replace(/\s/g, '').match(/(\d+)₸/g) || [];
          for (const p of prices) {
            const val = parseInt(p.replace('₸', ''), 10);
            if (val > 10000 && (!price || val > price)) {
              price = val;
            }
          }
        }

        if (sellerName && price) {
          sellers.push({ name: sellerName, url: sellerUrl, price });
        }
      }

      return { productId, title, reviewsCount, category, image, sellers };
    }, url);

    return {
      marketplace: 'kaspi',
      ...extractedData
    };
  }
}

module.exports = KaspiScraper;