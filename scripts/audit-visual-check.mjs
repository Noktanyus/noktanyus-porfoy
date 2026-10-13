import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const OUT_DIR = path.resolve('scratch_screenshots');
fs.mkdirSync(OUT_DIR, { recursive: true });

const TARGETS = [
  { route: '/', name: 'home' },
  { route: '/docs', name: 'docs' },
  { route: '/araclar', name: 'araclar' },
  { route: '/magaza/abonelikler', name: 'abonelikler' },
  { route: '/giris', name: 'giris' },
  { route: '/durum', name: 'durum' }
];

const VIEWPORTS = [
  { name: 'mobile', width: 375, height: 667 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 800 }
];

async function capture() {
  const browser = await chromium.launch({ headless: true });

  for (const vp of VIEWPORTS) {
    console.log(`Capturing ${vp.name} (${vp.width}x${vp.height})...`);
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 1
    });

    for (const target of TARGETS) {
      const page = await context.newPage();
      try {
        await page.goto(`https://noktanyus.com${target.route}`, { waitUntil: 'domcontentloaded', timeout: 25000 });
        await page.waitForTimeout(1000);

        const filename = `${target.name}_${vp.name}.png`;
        const filepath = path.join(OUT_DIR, filename);
        await page.screenshot({ path: filepath, fullPage: false });
        console.log(`  Saved ${filename}`);
      } catch (err) {
        console.error(`  Error capturing ${target.name} on ${vp.name}:`, err.message);
      } finally {
        await page.close();
      }
    }
    await context.close();
  }

  await browser.close();
  console.log('Capture finished. Inspecting screenshots...');
}

capture().catch(console.error);
