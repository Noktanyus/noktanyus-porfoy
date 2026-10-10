import { chromium } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const OUT_DIR = path.resolve('scratch_screenshots');
fs.mkdirSync(OUT_DIR, { recursive: true });

async function run() {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const consoleErrors = [];
  const networkErrors = [];

  console.log('1. Capturing Desktop (1440x900)...');
  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });
  const desktopPage = await desktopContext.newPage();

  desktopPage.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push({ page: desktopPage.url(), text: msg.text() });
    }
  });
  desktopPage.on('requestfailed', req => {
    networkErrors.push({ url: req.url(), failure: req.failure()?.errorText });
  });

  await desktopPage.goto('https://noktanyus.com', { waitUntil: 'networkidle', timeout: 30000 });
  await desktopPage.waitForTimeout(2000);

  await desktopPage.screenshot({ path: path.join(OUT_DIR, 'home_desktop_full.png'), fullPage: true });
  await desktopPage.screenshot({ path: path.join(OUT_DIR, 'home_desktop_hero.png') });

  // Scroll to playground & api showcase
  await desktopPage.evaluate(() => window.scrollTo(0, 1100));
  await desktopPage.waitForTimeout(1000);
  await desktopPage.screenshot({ path: path.join(OUT_DIR, 'home_desktop_playground.png') });

  await desktopPage.evaluate(() => window.scrollTo(0, 2200));
  await desktopPage.waitForTimeout(1000);
  await desktopPage.screenshot({ path: path.join(OUT_DIR, 'home_desktop_api_showcase.png') });

  await desktopPage.evaluate(() => window.scrollTo(0, 3200));
  await desktopPage.waitForTimeout(1000);
  await desktopPage.screenshot({ path: path.join(OUT_DIR, 'home_desktop_recipes.png') });

  console.log('2. Capturing Mobile (390x844)...');
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto('https://noktanyus.com', { waitUntil: 'networkidle', timeout: 30000 });
  await mobilePage.waitForTimeout(2000);

  await mobilePage.screenshot({ path: path.join(OUT_DIR, 'home_mobile_full.png'), fullPage: true });
  await mobilePage.screenshot({ path: path.join(OUT_DIR, 'home_mobile_hero.png') });

  // Open mobile menu
  const menuButton = mobilePage.locator('button[aria-label="Menüyü aç"], button[aria-controls="mobile-menu"]');
  if (await menuButton.count() > 0) {
    await menuButton.first().click({ force: true });
    await mobilePage.waitForTimeout(600);
    await mobilePage.screenshot({ path: path.join(OUT_DIR, 'home_mobile_menu.png') });
  }

  console.log('3. Capturing key pages (desktop)...');
  for (const pagePath of ['/araclar', '/docs', '/magaza', '/projelerim']) {
    const p = await desktopContext.newPage();
    await p.goto(`https://noktanyus.com${pagePath}`, { waitUntil: 'networkidle', timeout: 30000 });
    await p.waitForTimeout(1500);
    const slug = pagePath.replace('/', '') || 'root';
    await p.screenshot({ path: path.join(OUT_DIR, `${slug}_desktop.png`) });
    await p.close();
  }

  await browser.close();

  console.log('--- CAPTURE COMPLETED ---');
  console.log('Console Errors:', JSON.stringify(consoleErrors, null, 2));
  console.log('Network Errors:', JSON.stringify(networkErrors, null, 2));
}

run().catch(err => {
  console.error('Script failed:', err);
  process.exit(1);
});
