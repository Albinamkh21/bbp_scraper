const ScrapingOrchestrator = require('./src/app/ScrapingOrchestrator');
const KaspiScraper = require('./src/scrapers/KaspiScraper');
const config = require('./src/config/appConfig');

async function main() {

  console.log('=== ДИАГНОСТИКА ИМПОРТА ===:', KaspiScraper);  
  const kaspiStrategy = new KaspiScraper();
  
  // Передаем стратегию в наш Оркестратор
  const orchestrator = new ScrapingOrchestrator(kaspiStrategy);

  // Запуск с поисковым запросом из Config Layer
  const report = await orchestrator.run(config.scraping.defaultQuery);

  console.log('\n' + '='.repeat(70));
  console.log('ОТЧЕТ РАБОТЫ СИСТЕМЫ МОНИТОРИНГА:');
  console.log('='.repeat(70));
  console.log(JSON.stringify(report, null, 2));
}

main();