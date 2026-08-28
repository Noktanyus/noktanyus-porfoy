import { test, expect } from '@playwright/test';

const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  mobile: { width: 375, height: 667 },
};

const SNAPSHOT_PAGES = ['/', '/blog', '/magaza', '/fiyatlandirma'];

for (const [name, viewport] of Object.entries(VIEWPORTS)) {
  for (const path of SNAPSHOT_PAGES) {
    test(`visual snapshot ${name} - ${path}`, async ({ browser }) => {
      const context = await browser.newContext({ viewport });
      const page = await context.newPage();

      await page.goto(`http://localhost:3000${path}`, {
        waitUntil: 'networkidle',
        timeout: 30000,
      }).catch(() => {});

      // Wait for animations to settle
      await page.waitForTimeout(1500);

      // Disable animations for stable snapshot
      await page.addStyleTag({
        content: `
          *, *::before, *::after {
            animation-duration: 0s !important;
            animation-delay: 0s !important;
            transition-duration: 0s !important;
          }
        `
      });

      await expect(page).toHaveScreenshot(
        `visual-${name}-${path.replace(/\//g, '_') || 'home'}.png`,
        {
          fullPage: true,
          maxDiffPixelRatio: 0.02,
        }
      );

      await context.close();
    });
  }
}