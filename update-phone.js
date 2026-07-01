// test_phone.js
const BrowserManager = require('./src/core/BrowserManager');
const KaspiScraper = require('./src/scrapers/KaspiScraper'); // Импортируем сам скрапер

async function main() {
  console.log('=== ЗАПУСК ЧИСТОГО ТЕСТА ПРОДАКШН-МЕТОДА ===');  

  const browserManager = new BrowserManager();
  const targetUrl = 'https://kaspi.kz/shop/m/4883002/products?productCode=168035991&masterSku=168035991&merchantSku=168035991_632856483&tabId=PRODUCT';

  let browserInstance = null;

  try {
    // Инициализируем сессию через твой менеджер (прокси, юзер-агенты)
    const { browser, page } = await browserManager.createSession();
    browserInstance = browser; 

    console.log('[Test Router] Передаем управление в KaspiScraper...');
    
   
    const phone = await KaspiScraper.parseSellerPhone(page, targetUrl);

    console.log('\n' + '='.repeat(50));
    if (phone === 'blocked') {
      console.log('❌ ТЕСТ ПРОВАЛЕН: Каспи выдал капчу/блок.');
    } else if (phone) {
      console.log(`✅ ТЕСТ УСПЕШЕН! Телефон продавца: ${phone}`);
    } else {
      console.log('❌ ТЕСТ ПРОВАЛЕН: Телефон не найден или скрипт упал по таймауту.');
    }
    console.log('='.repeat(50) + '\n');

  } catch (error) {
    console.error(`\n[Test Router] Крах во время теста: ${error.message}`);
  } finally {
    if (browserInstance) {
      console.log('[Test Router] Закрываем браузер.');
      await browserInstance.close();
    }
  }
}

main();