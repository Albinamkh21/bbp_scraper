const fs = require('fs');
const path = require('path');
const BrowserManager = require('./src/core/BrowserManager');
const KaspiScraper = require('./src/scrapers/KaspiScraper');
const config = require('./src/config/appConfig');

async function main() {
  console.log('=== ЗАПУСК ЧИСТОГО СКРАПИНГА (СОХРАНЕНИЕ В ФАЙЛ) ===');  

  const browserManager = new BrowserManager();
  const kaspiScraper = new KaspiScraper();

  // Автоматически берем параметры из твоего Config Layer
  const query = config.scraping.defaultQuery || 'iPhone 15';
  const maxItems = config.scraping.maxItems || 27;

  console.log(`[Test] Запрос: "${query}" | Лимит: ${maxItems} товаров`);

  let browserInstance = null;
  const globalReport = [];

  try {
    // 1. Запуск браузера через твой менеджер (подтянутся прокси и настройки)
    const { browser, page } = await browserManager.createSession();
    browserInstance = browser; 

    // 2. Сбор ссылок с учетом пагинации и лимита maxItems
    console.log('[Test] Шаг 1: Сбор ссылок на товары...');
    const urls = await kaspiScraper.search(page, query, maxItems);
    console.log(`[Test] Получено ${urls.length} ссылок для обработки.`);

    // 3. Обход найденных ссылок и сбор данных из карточек
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      console.log(`\n[Test] [Обработка ${i + 1}/${urls.length}] Ссылка: ${url}`);

      try {
        // Парсим конкретный товар
        const productData = await kaspiScraper.parseProduct(page, url);
        
        globalReport.push({
          ...productData,
          scannedAt: new Date().toISOString()
        });
        
        console.log(`   ✓ Собрано: ${productData.title} (Продавцов: ${productData.sellers.length})`);

      } catch (itemError) {
        console.error(`   ✗ Ошибка при парсинге карточки: ${itemError.message}`);
      }

      // Пауза между товарами из твоего конфига, чтобы Kaspi не банил
      if (kaspiScraper.delay) {
        await kaspiScraper.delay(
          config.scraping.delays.iterationMin, 
          config.scraping.delays.iterationMax
        );
      }
    }

    // 4. Запись собранных данных в JSON-файл
    const outputPath = path.join(__dirname, 'scraping_result.json');
    fs.writeFileSync(outputPath, JSON.stringify(globalReport, null, 2), 'utf-8');

    console.log('\n' + '='.repeat(70));
    console.log(`УСПЕШНО! Данные (${globalReport.length} шт.) записаны в файл:`);
    console.log(outputPath);
    console.log('='.repeat(70));

  } catch (error) {
    console.error('\n[Test] Критическая ошибка во время работы скрапера:');
    console.error(error.message);
  } finally {
    // Гарантированно закрываем браузер на Windows
    if (browserInstance) {
      console.log('\n[Test] Закрытие ресурсов браузера.');
      await browserInstance.close();
    }
  }
}

main();