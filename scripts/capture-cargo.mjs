import { chromium } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const OUT_DIR = path.resolve('scratch_screenshots');
fs.mkdirSync(OUT_DIR, { recursive: true });

async function run() {
  console.log('Launching browser for Cargo tool visual inspection...');
  const browser = await chromium.launch({ headless: true });
  const consoleErrors = [];
  const networkErrors = [];

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });
  const page = await context.newPage();

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push({ page: page.url(), text: msg.text() });
    }
  });
  page.on('requestfailed', (req) => {
    networkErrors.push({ url: req.url(), failure: req.failure()?.errorText });
  });

  console.log('1. Navigating to https://noktanyus.com/araclar/kargo-desi-hesaplama ...');
  await page.goto('https://noktanyus.com/araclar/kargo-desi-hesaplama', {
    waitUntil: 'networkidle',
    timeout: 30000,
  });
  await page.waitForTimeout(1500);

  await page.screenshot({
    path: path.join(OUT_DIR, 'cargo_tool_desktop_desi.png'),
    fullPage: true,
  });
  console.log('Captured cargo_tool_desktop_desi.png');

  // Click on "Takip No & Firma Tespiti" tab
  console.log('2. Switching to Takip No tab and testing interaction...');
  const detectTab = page.locator('button:has-text("Takip No & Firma Tespiti")');
  await detectTab.click();
  await page.waitForTimeout(500);

  // Click on Trendyol Express sample chip
  const texChip = page.locator('button:has-text("Trendyol Express")');
  await texChip.click();
  await page.waitForTimeout(1000);

  await page.screenshot({
    path: path.join(OUT_DIR, 'cargo_tool_desktop_detect.png'),
    fullPage: true,
  });
  console.log('Captured cargo_tool_desktop_detect.png');

  // Click on 9 Kargo Firması Rehberi tab
  console.log('3. Switching to 9 Kargo Firması Rehberi tab...');
  const guideTab = page.locator('button:has-text("9 Kargo Firması Rehberi")');
  await guideTab.click();
  await page.waitForTimeout(500);

  await page.screenshot({
    path: path.join(OUT_DIR, 'cargo_tool_desktop_guide.png'),
    fullPage: true,
  });
  console.log('Captured cargo_tool_desktop_guide.png');

  // Check /araclar list page
  console.log('4. Navigating to https://noktanyus.com/araclar ...');
  await page.goto('https://noktanyus.com/araclar', {
    waitUntil: 'networkidle',
    timeout: 30000,
  });
  await page.waitForTimeout(1500);
  await page.screenshot({
    path: path.join(OUT_DIR, 'araclar_catalog.png'),
    fullPage: true,
  });
  console.log('Captured araclar_catalog.png');

  // Mobile viewport test
  console.log('5. Mobile viewport check (390x844)...');
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto('https://noktanyus.com/araclar/kargo-desi-hesaplama', {
    waitUntil: 'networkidle',
    timeout: 30000,
  });
  await mobilePage.waitForTimeout(1500);
  await mobilePage.screenshot({
    path: path.join(OUT_DIR, 'cargo_tool_mobile.png'),
    fullPage: true,
  });
  console.log('Captured cargo_tool_mobile.png');

  await browser.close();

  console.log('\n--- AUDIT SUMMARY ---');
  console.log('Console Errors:', JSON.stringify(consoleErrors, null, 2));
  console.log('Network Errors:', JSON.stringify(networkErrors, null, 2));
}

run().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
