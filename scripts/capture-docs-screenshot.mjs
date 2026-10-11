import { chromium } from 'playwright';

async function capture() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });

  await page.goto('https://noktanyus.com/docs', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Take screenshot of the top hero & explorer
  await page.screenshot({ path: 'scripts/docs-explorer.png', fullPage: false });

  // Click on "Olası Hata Yanıtları" tab of the first endpoint
  const errorTab = await page.$('button:has-text("Olası Hata Yanıtları")');
  if (errorTab) {
    await errorTab.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'scripts/docs-errors.png', fullPage: false });
  }

  // Click on "Kod Örnekleri" tab
  const codeTab = await page.$('button:has-text("Kod Örnekleri")');
  if (codeTab) {
    await codeTab.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'scripts/docs-code.png', fullPage: false });
  }

  // Switch to Redoc view
  const redocButton = await page.$('button:has-text("Redoc 3 Sütun")');
  if (redocButton) {
    await redocButton.click();
    await page.waitForTimeout(3500);
    const redocMount = await page.$('[data-testid="redoc-mount"]');
    if (redocMount) {
      await redocMount.scrollIntoViewIfNeeded();
    }
    await page.screenshot({ path: 'scripts/docs-redoc.png', fullPage: false });
  }

  await browser.close();
  console.log('Screenshots captured successfully.');
}

capture().catch(err => {
  console.error(err);
  process.exit(1);
});
