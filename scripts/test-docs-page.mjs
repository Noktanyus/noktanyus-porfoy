import { chromium } from 'playwright';

async function testDocs() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const consoleLogs = [];
  page.on('console', msg => consoleLogs.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => consoleLogs.push(`[pageerror] ${err.message}`));

  console.log('Navigating to https://noktanyus.com/docs...');
  const res = await page.goto('https://noktanyus.com/docs', { waitUntil: 'networkidle', timeout: 30000 });
  console.log('Status:', res.status());

  await page.waitForTimeout(2000);

  // 1. Check Native ApiExplorer
  const searchInput = await page.$('input[placeholder*="Endpoint adı"]');
  console.log('Search input found:', !!searchInput);

  const endpointCards = await page.$$('code');
  console.log('Code elements count:', endpointCards.length);

  const ibanElement = await page.$('text=/api/v1/validate/iban');
  console.log('IBAN endpoint visible:', !!ibanElement);

  const requestHeaders = await page.textContent('body');
  console.log('Has headers info:', requestHeaders.includes('Content-Type: application/json'));
  console.log('Has 200 OK info:', requestHeaders.includes('Başarılı Yanıt (200 OK)'));
  console.log('Has error info:', requestHeaders.includes('Olası Hata Yanıtları'));

  // 2. Switch to Redoc view
  console.log('Switching to Redoc view...');
  const redocButton = await page.$('button:has-text("Redoc 3 Sütun")');
  if (redocButton) {
    await redocButton.click();
    await page.waitForTimeout(3000);

    const redocMount = await page.$('[data-testid="redoc-mount"]');
    console.log('Redoc mount exists:', !!redocMount);

    const redocError = await page.$('.border-red-300');
    console.log('Redoc error banner present:', !!redocError);
  }

  console.log('Console errors (if any):');
  const errors = consoleLogs.filter(l => l.includes('[error]') || l.includes('[pageerror]'));
  if (errors.length > 0) {
    errors.forEach(e => console.log('  ', e));
  } else {
    console.log('  No console errors!');
  }

  await browser.close();
  console.log('Test completed.');
}

testDocs().catch(err => {
  console.error(err);
  process.exit(1);
});
