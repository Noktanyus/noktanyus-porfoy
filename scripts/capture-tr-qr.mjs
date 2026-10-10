import { chromium } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const OUT_DIR = path.resolve('scratch_screenshots');
fs.mkdirSync(OUT_DIR, { recursive: true });

async function run() {
  console.log('Launching browser for TR Karekod tool visual inspection...');
  const browser = await chromium.launch({ headless: true });
  const consoleErrors = [];

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push({ text: msg.text() });
    }
  });

  console.log('1. Navigating to https://noktanyus.com/araclar/tr-karekod-olusturucu ...');
  await page.goto('https://noktanyus.com/araclar/tr-karekod-olusturucu', {
    waitUntil: 'networkidle',
    timeout: 30000,
  });
  await page.waitForTimeout(1500);

  await page.screenshot({
    path: path.join(OUT_DIR, 'tr_qr_desktop_create.png'),
    fullPage: true,
  });
  console.log('Captured tr_qr_desktop_create.png');

  // Switch to Parse Tab
  console.log('2. Switching to Parse Tab...');
  const parseTab = page.locator('button:has-text("Karekod Çöz & Doğrula")');
  await parseTab.click();
  await page.waitForTimeout(500);

  // Click on "Oluşturulan Karekodu Çözümle" button
  const resolveBtn = page.locator('button:has-text("Oluşturulan Karekodu Çözümle")');
  await resolveBtn.click();
  await page.waitForTimeout(1000);

  await page.screenshot({
    path: path.join(OUT_DIR, 'tr_qr_desktop_parse.png'),
    fullPage: true,
  });
  console.log('Captured tr_qr_desktop_parse.png');

  // Mobile Viewport Check
  console.log('3. Mobile Viewport Check (390x844)...');
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto('https://noktanyus.com/araclar/tr-karekod-olusturucu', {
    waitUntil: 'networkidle',
    timeout: 30000,
  });
  await mobilePage.waitForTimeout(1500);

  await mobilePage.screenshot({
    path: path.join(OUT_DIR, 'tr_qr_mobile.png'),
    fullPage: true,
  });
  console.log('Captured tr_qr_mobile.png');

  await browser.close();

  console.log('\n--- AUDIT SUMMARY ---');
  console.log('Console Errors:', JSON.stringify(consoleErrors, null, 2));
}

run().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
