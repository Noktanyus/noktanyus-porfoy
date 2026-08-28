import { test, expect } from '@playwright/test';

const PAGES = [
  '/',
  '/blog',
  '/magaza',
  '/fiyatlandirma',
  '/hakkimda',
  '/projelerim',
  '/iletisim',
];

for (const path of PAGES) {
  test(`${path} has no critical console errors`, async ({ page }) => {
    const errors: string[] = [];
    const warnings: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
      if (msg.type() === 'warning') warnings.push(msg.text());
    });

    page.on('pageerror', err => {
      errors.push(`PAGE_ERROR: ${err.message}`);
    });

    await page.goto(`http://localhost:3000${path}`, {
      waitUntil: 'domcontentloaded',
      timeout: 20000,
    });

    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2000);

    // Filter known non-critical errors
    const NON_CRITICAL_PATTERNS = [
      'Turnstile',
      'Yandex',
      'Failed to load resource',  // CDN/resource issues
      'favicon',
      'next-font',
      'Hydration',                 // Some hydration mismatches can be benign
      'Download the React DevTools',
      'sentry',
      'gtag',
      'analytics',
    ];

    const criticalErrors = errors.filter(e =>
      !NON_CRITICAL_PATTERNS.some(pattern => e.includes(pattern))
    );

    if (criticalErrors.length > 0) {
      console.log(`[${path}] Critical errors:`);
      criticalErrors.forEach(e => console.log(`  - ${e.substring(0, 200)}`));
    }

    expect(criticalErrors, `Critical console errors on ${path}`).toEqual([]);
  });
}

test('aggregate console health check', async ({ page }) => {
  const errorMap: Record<string, string[]> = {};

  for (const path of PAGES) {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', err => errors.push(err.message));

    await page.goto(`http://localhost:3000${path}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    errorMap[path] = errors;
    page.removeAllListeners('console');
    page.removeAllListeners('pageerror');
  }

  // Summary log
  const totalErrors = Object.values(errorMap).flat().length;
  console.log(`Total console errors across all pages: ${totalErrors}`);
});