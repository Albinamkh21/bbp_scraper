const BrowserManager = require('../core/BrowserManager');
const AnalyticsService = require('../services/AnalyticsService');
const config = require('../config/appConfig');

// Подключаем репозиторий задач и сервис сохранения данных
const MarketplaceRepository = require('../repositories/MarketplaceRepository');
const TaskRepository = require('../repositories/TaskRepository');
const ScrapingDataService = require('../services/ScrapingDataService');

class ScrapingOrchestrator {
  constructor(scraperStrategy) {
    this.scraper = scraperStrategy;
    this.browserManager = new BrowserManager();
  }

  async run(searchQuery) {
    console.log(`[Orchestrator] Старт транзакции автоматизации для: "${searchQuery}"`);
    
    const globalReport = [];
    let browserInstance = null;
    let task = null;

    // Автоматически определяем имя маркетплейса из названия класса скрапера 
    // (например: KaspiScraper -> "kaspi")
    const marketplaceName = this.scraper.constructor.name.replace('Scraper', '').toLowerCase() || 'kaspi';
    const baseUrl = marketplaceName === 'kaspi' ? 'https://kaspi.kz' : '';

    try {
      // 1. Инициализируем маркетплейс и создаем задачу со статусом "pending"
      const marketplace = await MarketplaceRepository.upsert({ name: marketplaceName, baseUrl });
      task = await TaskRepository.create({
        marketplaceId: marketplace.id,
        searchType: 'query', // По умолчанию текстовый поиск
        query: searchQuery
      });

      // Переводим задачу в статус "processing"
      await TaskRepository.updateStatus(task.id, 'processing');

      // 2. Запуск браузерной сессии
      const { browser, page } = await this.browserManager.createSession();
      browserInstance = browser; // Сохраняем ссылку для блока finally

      // Поиск ссылок
      const urls = await this.scraper.search(page, searchQuery);
      console.log(`[Orchestrator] Получено ${urls.length} ссылок для обработки.`);

      // Обход ссылок urls.length
      for (let i = 0; i < 1; i++) {
        const url = urls[i];
        console.log(`\n[Orchestrator] [Обработка ${i + 1}/${urls.length}] Ссылка: ${url}`);

        try {
          // Парсим карточку товара
          const productData = await this.scraper.parseProduct(page, url);
          
          // 3. Сохраняем полученные данные в БД через Сервис
          await ScrapingDataService.saveProductData(task.id, productData);

          // Твоя заглушка аналитики
          const analytics = { status: "disabled_temporarily" };

          globalReport.push({
            ...productData,
            analytics,
            scannedAt: new Date().toISOString()
          });
          
          console.log(`   ✓ Собрано и сохранено в БД: ${productData.title} (Продавцов: ${productData.sellers.length})`);

        } catch (itemError) {
          console.error(`   ✗ Ошибка при парсинге карточки: ${itemError.message}`);
        }

        // Пауза между товарами
        if (this.scraper.delay) {
          await this.scraper.delay(
            config.scraping.delays.iterationMin, 
            config.scraping.delays.iterationMax
          );
        }
      }

      // 4. Если всё прошло успешно, закрываем задачу статусом "completed"
      await TaskRepository.updateStatus(task.id, 'completed');
      console.log(`\n[Orchestrator] Задача успешно завершена. Таска ID: ${task.id}`);

    } catch (criticalError) {
      console.error('[Orchestrator] Критический сбой сценария:', criticalError.message);
      
      // Если задача была создана в БД, фиксируем сбой
      if (task) {
        await TaskRepository.updateStatus(task.id, 'failed');
      }
    } finally {
      // Безопасное закрытие браузера, только если он был успешно инициализирован
      if (browserInstance) {
        console.log('\n[Orchestrator] Закрытие ресурсов автоматизации...');
        await browserInstance.close();
      }
    }

    return globalReport;
  }
}

module.exports = ScrapingOrchestrator;