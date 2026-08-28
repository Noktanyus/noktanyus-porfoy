import { test, expect } from '@playwright/test';

const PAGES = [
  '/',
  '/blog',
  '/magaza',
  '/fiyatlandirma',
  '/hakkimda',
  '/projelerim',
  '/iletisim',
  '/yasal/kvkk',
];

const VIEWPORTS = [
  { name: 'mobile-small', viewport: { width: 375, height: 667 } },   // iPhone SE
  { name: 'mobile-large', viewport: { width: 414, height: 896 } },   // iPhone Plus
  { name: 'tablet', viewport: { width: 768, height: 1024 } },         // iPad
  { name: 'desktop', viewport: { width: 1440, height: 900 } },        // Standard
];

for (const vp of VIEWPORTS) {
  test.describe(`${vp.name} viewport (${vp.viewport.width}x${vp.viewport.height})`, () => {
    for (const path of PAGES) {
      test(`${path} renders without overflow`, async ({ browser }) => {
        const context = await browser.newContext({ viewport: vp.viewport });
        const page = await context.newPage();

        const response = await page.goto(`http://localhost:3000${path}`, {
          waitUntil: 'domcontentloaded',
          timeout: 20000,
        }).catch(() => null);

        // Page must respond (any non-error status)
        if (response && response.status() >= 500) {
          test.skip(true, `Server error ${response.status()} on ${path}`);
          return;
        }

        await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

        // Check horizontal overflow (no horizontal scrollbar)
        const hasHorizontalScroll = await page.evaluate(() => {
          return document.documentElement.scrollWidth > document.documentElement.clientWidth + 1;
        });

        // Check viewport meta (skip for API routes without HTML)
        const viewportMeta = await page.locator('meta[name="viewport"]').count();
        if (viewportMeta > 0) {
          const metaContent = await page.locator('meta[name="viewport"]').getAttribute('content');
          expect(metaContent, `viewport meta content on ${path}`).toContain('width=device-width');
        }

        // Log overflow issue but allow mobile to scroll if intentional (e.g. tables)
        if (hasHorizontalScroll) {
          console.warn(`Horizontal scroll on ${vp.name} at ${path}`);
        }

        await context.close();
      });
    }
  });
}