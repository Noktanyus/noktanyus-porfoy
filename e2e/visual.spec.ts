import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  mobile: { width: 375, height: 667 },
};

const SNAPSHOT_PAGES = ['/', '/blog', '/magaza', '/fiyatlandirma'];

const SNAPSHOT_DIR = path.join(__dirname, 'visual.spec.ts-snapshots');

for (const [name, viewport] of Object.entries(VIEWPORTS)) {
  for (const pagePath of SNAPSHOT_PAGES) {
    const snapshotFile = `visual-${name}-${pagePath.replace(/\//g, '_') || 'home'}.png`;
    // Playwright linux CI suffix convention
    const baselineCandidates = [
      path.join(SNAPSHOT_DIR, snapshotFile.replace('.png', '-chromium-linux.png')),
      path.join(SNAPSHOT_DIR, snapshotFile),
    ];
    const hasBaseline = baselineCandidates.some((p) => fs.existsSync(p));

    test(`visual snapshot ${name} - ${pagePath}`, async ({ browser }, testInfo) => {
      test.skip(
        !hasBaseline && process.env.UPDATE_SNAPSHOTS !== '1',
        'Visual baseline henüz repo’da yok — UPDATE_SNAPSHOTS=1 ile üretin'
      );

      const context = await browser.newContext({ viewport });
      const page = await context.newPage();

      await page
        .goto(`http://localhost:3000${pagePath}`, {
          waitUntil: 'networkidle',
          timeout: 30000,
        })
        .catch(() => {});

      await page.waitForTimeout(1500);

      await page.addStyleTag({
        content: `
          *, *::before, *::after {
            animation-duration: 0s !important;
            animation-delay: 0s !important;
            transition-duration: 0s !important;
          }
        `,
      });

      try {
        await expect(page).toHaveScreenshot(snapshotFile, {
          fullPage: true,
          maxDiffPixelRatio: 0.02,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (message.includes("A snapshot doesn't exist")) {
          testInfo.skip(true, 'Baseline snapshot missing');
          return;
        }
        throw err;
      }

      await context.close();
    });
  }
}
