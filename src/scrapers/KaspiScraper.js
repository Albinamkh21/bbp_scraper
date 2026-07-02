const BaseScraper = require('./BaseScraper');
const config = require('../config/appConfig');


class KaspiScraper extends BaseScraper {
  async delay(min, max) {
    const ms = Math.floor(Math.random() * (max - min + 1)) + min;
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  async search(page, query, maxItems = 100) {
    console.log('[KaspiScraper] Открытие главной страницы Kaspi...');

    await page.goto(config.scraping.baseUrl, {
      waitUntil: 'domcontentloaded',
      timeout: config.scraping.timeouts.navigation
    });

    await this.delay(config.scraping.delays.searchMin, config.scraping.delays.searchMax);

    const allProductUrls = new Set();
    let currentPage = 1;

    console.log(`[KaspiScraper] Старт сбора товаров по запросу: "${query}". Цель: ${maxItems} шт.`);

    while (allProductUrls.size < maxItems) {
      try {
        if (currentPage === 1) {
          const searchUrl = `${config.scraping.baseUrl}search/?text=${encodeURIComponent(query)}&sort=relevance`;
          await page.goto(searchUrl, {
            waitUntil: 'domcontentloaded',
            timeout: config.scraping.timeouts.navigation
          });
          await this.delay(config.scraping.delays.searchMin, config.scraping.delays.searchMax);
        } else {
          await page.evaluate(async () => {
            await new Promise((resolve) => {
              let totalHeight = 0;
              const distance = 300;
              const timer = setInterval(() => {
                window.scrollBy(0, distance);
                totalHeight += distance;
                if (totalHeight >= document.body.scrollHeight - window.innerHeight) {
                  clearInterval(timer);
                  resolve();
                }
              }, 150);
            });
          });

          await this.delay(1000, 2000);

          const isPageClicked = await page.evaluate((pageNum) => {
            const pages = Array.from(document.querySelectorAll('.pagination li, li.pagination__el, .pagination a'));
            const targetPage = pages.find(el => el.textContent.trim() === String(pageNum));
            
            if (targetPage) {
              targetPage.click();
              return true;
            }
            return false;
          }, currentPage);

          if (!isPageClicked) {
            console.log(`[KaspiScraper] На странице №${currentPage} товары не найдены. Остановка сбора.`);
            break;
          }

          await this.delay(config.scraping.delays.searchMin, config.scraping.delays.searchMax);
        }

        await page.waitForSelector('a[href*="/shop/p/"]', { timeout: 15000 });
      } catch (e) {
        console.log(`[KaspiScraper] На странице №${currentPage} товары не найдены. Остановка сбора.`);
        break;
      }

      const productUrlsOnPage = await page.$$eval('a[href*="/shop/p/"]', links => {
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

      if (!productUrlsOnPage.length) {
        console.log(`[KaspiScraper] Ссылки не извлеклись со страницы №${currentPage}. Остановка.`);
        break;
      }

      let newLinksCount = 0;
      for (const url of productUrlsOnPage) {
        if (allProductUrls.size >= maxItems) break;
        
        if (!allProductUrls.has(url)) {
          allProductUrls.add(url);
          newLinksCount++;
        }
      }

      console.log(`[KaspiScraper] Страница №${currentPage} обработана. Найдено новых товаров: ${newLinksCount}. Всего собрано: ${allProductUrls.size}/${maxItems}`);

      if (newLinksCount === 0) {
        console.log('[KaspiScraper] Новых товаров на странице не обнаружено (повторы). Остановка сбора.');
        break;
      }

      currentPage++;
    }

    const resultUrls = Array.from(allProductUrls);

    if (!resultUrls.length) {
      throw new Error('Товары не найдены по запросу');
    }

    console.log(`[KaspiScraper] Сбор завершен. Итоговый массив содержит ${resultUrls.length} товаров.`);
    return resultUrls;
  }

  async parseProduct(page, url) {
    await this.delay(config.scraping.delays.productMin, config.scraping.delays.productMax);
    await page.goto(url, { 
      waitUntil: 'domcontentloaded', 
      timeout: config.scraping.timeouts.navigation 
    });
    
    await page.waitForSelector('h1', { timeout: config.scraping.timeouts.selector });
    await this.delay(config.scraping.delays.productMin, config.scraping.delays.productMax);

   
    const baseData = await page.evaluate((productUrl) => {
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


    const ratingContainer = document.querySelector('.item__rating');
    let reviewsCount = 0;
    
    if (ratingContainer) {
        const reviewLink = ratingContainer.querySelector('.item__rating-link span');
        if (reviewLink) {
            const match = reviewLink.textContent.match(/(\d+)/);
            reviewsCount = match ? parseInt(match[1], 10) : 0;
        }
    }
      
      //const reviewsMatch = document.body.innerText.match(/\((\d+)\s*отзыв/i);
      //const reviewsCount = reviewsMatch ? parseInt(reviewsMatch[1], 10) : null;

    
   
     
     const categoryElements = document.querySelectorAll('.breadcrumbs a.breadcrumbs__item');
      
      // 2. Извлекаем чистый текст и сразу превращаем в массив строк
      const categoriesList = Array.from(categoryElements).map(el => el.innerText.trim());
      
    
      const rawCategories = categoriesList.filter(text => {
          const lower = text.toLowerCase();
          return text.length > 0 && 
                !lower.includes('магазин') && 
                !lower.includes('каспи') && 
                !lower.includes('главная');
      });     

    


      const image = document.querySelector('img[src*="resources.cdn"]')?.src || null;

      const ratingEl = document.querySelector('.item__rating [class*="_"]');
      const rating = parseRatingFromClass(ratingEl);

      return { productId, title, reviewsCount, rawCategories, image, rating };
    }, url);

    // 2. Цикл для сбора продавцов с учетом пагинации
    const allSellers = [];
    let hasNextPage = true;

    while (hasNextPage) {
    
      const pageSellers = await page.evaluate(() => {
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
          console.log(`[KaspiScraper 11] sellerName": ${sellerName}`);

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
        let deliveryInfo = 'Нет данных'; 
        const deliveryCell = cells[2];
        if (deliveryCell) {
            const options = Array.from(deliveryCell.querySelectorAll('.sellers-table__delivery-cell-option'));
            if (options.length > 0) {
               
                deliveryInfo = options.map(opt => opt.innerText.trim().replace(/\s+/g, ' ')).join(' | ');
            }
        }

          if (sellerName && price) {
            sellers.push({ 
              name: sellerName, 
              url: sellerUrl, 
              price, 
              rating: sellerRating, 
              reviewsCount: sellerReviews,
              deliveryInfo: deliveryInfo
            });
          }
        }
        return sellers;
      });

      // Добавляем собранных продавцов в общий массив
      allSellers.push(...pageSellers);

    
      hasNextPage = await page.evaluate(() => {
        // Ищем все элементы пагинации на странице
        const paginationEls = Array.from(document.querySelectorAll('.pagination__el'));
        const nextBtn = paginationEls.find(el => el.textContent.trim() === 'Следующая');
        
        // Проверяем, что кнопка есть и у нее нет класса _disabled (конец списка)
        if (nextBtn && !nextBtn.classList.contains('_disabled')) {
          nextBtn.click();
          return true;
        }
        return false;
      });

      // Если кликнули, ждем загрузки следующей порции продавцов
      if (hasNextPage) {
        await this.delay(1000, 2000); 
      }
    }

    // Собираем всё в итоговый объект
    return {
      marketplace: 'kaspi',
      ...baseData,
      sellers: allSellers
    };
  }

  static async parseSellerPhone(page, sellerUrl) {
    try {
        console.log(`[KaspiScraper] Открываем: ${sellerUrl}`);
        
        // Переходим и ждем базовой загрузки DOM
        await page.goto(sellerUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        
        // 1. ПРОВЕРКА НА БЛОКИРОВКУ / КАПЧУ
        // Проверяем, не подсунул ли Каспи страницу проверки робота
        const title = await page.title();
        if (title.includes('Вы заблокированы') || title.includes('Cloudflare') || title.includes('Checking your browser')) {
            console.error(`[KaspiScraper] СТОП! Поймали блокировку или капчу (Title: ${title})`);
            return 'blocked'; 
        }

        console.log(`[KaspiScraper] Базовый HTML загружен. Ждем отрисовку React-интерфейса...`);

        // 2. ЖДЕМ СБОРКУ ИНТЕРФЕЙСА (главный контейнер продавца)
        // Если за 10 секунд он не появился — значит, скрипты Каспия не выполнились (бан JS-файлов)
        const profileContainer = page.locator('.merchant-shop-profile');
        try {
            await profileContainer.waitFor({ state: 'visible', timeout: 10000 });
        } catch (e) {
            console.error(`[KaspiScraper] Ошибка: Скрипты страницы не ожили. Контейнер магазина не найден. Возможен теневой бан.`);
            return 'empty_page';
        }

        // 3. ИЩЕМ КНОПКУ КОНТАКТОВ
        const infoButton = page.locator('.merchant-shop-profile__info-button');
        await infoButton.waitFor({ state: 'visible', timeout: 5000 });

        // Небольшая "человеческая" пауза перед кликом
        await page.waitForTimeout(1000);

        // Кликаем через dispatchEvent, чтобы сработало наверняка на SPA
        await infoButton.dispatchEvent('click');
        console.log(`[KaspiScraper] Кликнули по кнопке контактов.`);

        // 4. ЖДЕМ МОДАЛКУ С ТЕЛЕФОНОМ
        const modal = page.locator('.merchant-contacts-informer');
        await modal.waitFor({ state: 'visible', timeout: 5000 });

        // 5. ПАРСИМ НОМЕР
        const phone = await page.evaluate(() => {
            const icon = document.querySelector('.merchant-contacts-informer__row [data-test-id="icon-phone"]');
            if (!icon) return null;
            const row = icon.closest('.merchant-contacts-informer__row');
            if (!row) return null;
            const textElement = row.querySelector('.merchant-contacts-informer__text');
            return textElement ? textElement.innerText.trim() : null;
        });

        console.log(`  ✓ Успешно получен телефон: ${phone || 'не найден'}`);
        return phone;

    } catch (error) {
        console.error(`[KaspiScraper] Критическая ошибка парсинга: ${error.message}`);
        return null;
    }
}
  



}




module.exports = KaspiScraper;