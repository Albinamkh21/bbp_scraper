const fs = require('fs');
const path = require('path');
const ScrapingOrchestrator = require('./app/ScrapingOrchestrator');
const KaspiScraper = require('./scrapers/KaspiScraper');

// Переключаем Playwright в режим отображения браузера
process.env.HEADLESS = 'false'; 

async function start() {
    // Берем поисковый запрос из аргументов командной строки или ставим дефолтный
    const query = process.argv[2] || 'iPhone 15'; 
    
    console.log(`\n=== [LOCAL TEST START] Запрос: "${query}" ===`);

    try {
        const scraperStrategy = new KaspiScraper();
        const orchestrator = new ScrapingOrchestrator(scraperStrategy);
        
        // Прямой вызов парсера в обход очередей
        const scrapingResults = await orchestrator.run(query); 

        // Сохраняем в локальный файл
        const fileName = `result_${query.replace(/[^a-z0-9а-яё]/gi, '_')}.json`;
        const outputPath = path.join(__dirname, '..', fileName);
        
        fs.writeFileSync(outputPath, JSON.stringify(scrapingResults, null, 2), 'utf-8');
        
        console.log(`=== [SUCCESS] Результаты сохранены в файл: ${fileName} ===\n`);
    } catch (error) {
        console.error('=== [CRITICAL ERROR] ===', error);
    }
}

start();