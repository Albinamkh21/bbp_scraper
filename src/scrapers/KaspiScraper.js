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


      const parseRatingFromClass = (element) => {
          if (!element) return null;
          const classes = Array.from(element.classList);
          const ratingClass = classes.find(c => c.startsWith('_'));
          if (ratingClass) {
              return parseInt(ratingClass.substring(1), 10) / 10;
          }
          return null;
      };
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

      const ratingEl = document.querySelector('.item__rating [class*="_"]');
      const rating = parseRatingFromClass(ratingEl);
 
      const sellers = [];
      const rows = document.querySelectorAll('tr');

     for (const row of rows) {
        const cells = row.querySelectorAll('td');
        if (cells.length < 3) continue;

        const mainCell = cells[0];
        if (!mainCell) continue;

        let sellerName = null;
        let sellerUrl = null;
        let sellerReviews = 0;
        let sellerRating = null;

      const nameLink = mainCell.querySelector('a');
      if (nameLink) {
        sellerName = nameLink.textContent ? nameLink.textContent.trim() : null;
        sellerUrl = nameLink.getAttribute('href') || null;
      }

      const cellText = mainCell.textContent || '';
      const reviewMatch = cellText.match(/(\d+)\s*отзыв/i);
      if (reviewMatch) {
        sellerReviews = parseInt(reviewMatch[1], 10);
      }

        const ratingEl = mainCell.querySelector('.rating._seller');
        if (ratingEl) {
          const cls = Array.from(ratingEl.classList).find(c => c.startsWith('_') && c !== '_seller');
          if (cls) {
            sellerRating = parseInt(cls.substring(1), 10) / 10;
          }
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
        sellers.push({ 
          name: sellerName, 
          url: sellerUrl, 
          price, 
          rating: sellerRating, 
          reviewsCount: sellerReviews 
        });
      }
    }

      return { productId, title, reviewsCount, category, image, sellers , rating };
    }, url);

    return {
      marketplace: 'kaspi',
      ...extractedData
    };
  }

  static async parseSellerPhone(page, sellerUrl) {
      try {
        console.log(`[KaspiScraper] Открываем страницу: ${sellerUrl}`);
        await page.goto(sellerUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        console.log(`[KaspiScraper] Страница загружена, ищем элемент с телефоном...`);

        // 1. Ждем появления конкретного контейнера с контактами (до 5 секунд, чтобы не виснуть)
        const contactSelector = '.merchant-profile__contact-text';
        try {
          await page.waitForSelector(contactSelector, { timeout: 5000 });
        } catch (e) {
          console.log(`[KaspiScraper] Предупреждение: Селектор ${contactSelector} не найден на этой странице.`);
        }

        // 2. Достаем текст строго из нужного элемента
        const phone = await page.evaluate(() => {
          // Ищем конкретно текстовый блок телефона
          const phoneElement = document.querySelector('.merchant-profile__contact-text');
          if (!phoneElement) return null;

          const text = phoneElement.innerText;
          
          // Наша регулярка, адаптированная под формат +7 (707) 300-03-30
          const phoneMatch = text.match(/(?:\+7|8)[\s_]?\(?\d{3}\)?[\s_-]?\d{3}[\s_-]?\d{2}[\s_-]?\d{2}/);
          return phoneMatch ? phoneMatch[0].trim() : text.trim(); // Если регулярка почему-то не совпала, вернем чистый текст элемента
        });

        console.log(`   ✓ Полученный телефон: ${phone || 'не найден'}`);
        return phone;

      } catch (error) {
        console.error(`Ошибка при парсинге телефона по ссылке ${sellerUrl}:`, error.message);
        return null;
      }
  }



}




module.exports = KaspiScraper;