const BrowserManager = require('../core/BrowserManager');
const AnalyticsService = require('../services/AnalyticsService');
const config = require('../config/appConfig');

class ScrapingOrchestrator {
  constructor(scraperStrategy) {
    this.scraper = scraperStrategy;
    this.browserManager = new BrowserManager();
  }

  async run(searchQuery) {
    console.log(`[Orchestrator] Старт транзакции автоматизации для: "${searchQuery}"`);
    const { browser, page } = await this.browserManager.createSession();
    const globalReport = [];

    try {
      const urls = await this.scraper.search(page, searchQuery);
      console.log(`[Orchestrator] Получено ${urls.length} ссылок для обработки.`);

      for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        console.log(`\n[Orchestrator] [Обработка ${i + 1}/${urls.length}] Ссылка: ${url}`);

        try {
          const productData = await this.scraper.parseProduct(page, url);
          //const analytics = AnalyticsService.calculateMetrics(productData.sellers);
          const analytics = { status: "disabled_temporarily" };

          globalReport.push({
            ...productData,
            analytics,
            scannedAt: new Date().toISOString()
          });
          
          console.log(`  ✓ Собрано: ${productData.title} (Продавцов: ${productData.sellers.length})`);

        } catch (itemError) {
          console.error(`  ✗ Ошибка при парсинге карточки: ${itemError.message}`);
        }

        // Пауза между товарами на базе конфигурации
        if (this.scraper.delay) {
          await this.scraper.delay(
            config.scraping.delays.iterationMin, 
            config.scraping.delays.iterationMax
          );
        }
      }

    } catch (criticalError) {
      console.error('[Orchestrator] Критический сбой сценария:', criticalError.message);
    } finally {
      console.log('\n[Orchestrator] Закрытие ресурсов автоматизации...');
      await browser.close();
    }

    return globalReport;
  }
}

module.exports = ScrapingOrchestrator;