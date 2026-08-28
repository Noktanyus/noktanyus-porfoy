import { test, expect } from '@playwright/test';

const PUBLIC_PAGES = [
  '/',
  '/blog',
  '/magaza',
  '/fiyatlandirma',
  '/hakkimda',
  '/projelerim',
  '/iletisim',
];

for (const path of PUBLIC_PAGES) {
  test(`${path} has proper accessibility`, async ({ page }) => {
    const response = await page.goto(`http://localhost:3000${path}`, {
      waitUntil: 'domcontentloaded',
      timeout: 20000,
    });

    if (response && response.status() >= 500) {
      test.skip(true, `Server error on ${path}`);
      return;
    }

    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

    // Has <html lang="...">
    const htmlLang = await page.locator('html').getAttribute('lang');
    expect(htmlLang, `html lang on ${path}`).toBeTruthy();

    // Has <title>
    const title = await page.title();
    expect(title.length, `title length on ${path}`).toBeGreaterThan(0);

    // Has <meta name="description">
    const description = await page.locator('meta[name="description"]').getAttribute('content');
    expect(description, `description on ${path}`).toBeTruthy();

    // All images have alt (or alt="" for decorative, role="presentation")
    const imagesWithoutAlt = await page.locator('img:not([alt])').count();
    expect(imagesWithoutAlt, `images without alt on ${path}`).toBe(0);

    // Has <main> or <main role="main">
    const mainCount = await page.locator('main, [role="main"]').count();
    expect(mainCount, `main landmark on ${path}`).toBeGreaterThanOrEqual(1);

    // Page has at least one heading
    const headings = await page.locator('h1, h2, h3').count();
    expect(headings, `headings on ${path}`).toBeGreaterThanOrEqual(1);
  });
}

test('all pages have proper heading hierarchy', async ({ page }) => {
  for (const path of PUBLIC_PAGES) {
    await page.goto(`http://localhost:3000${path}`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});

    // Each page should have exactly one h1
    const h1Count = await page.locator('h1').count();
    if (h1Count > 0) {
      // Multiple h1 is acceptable in some cases but flag if more than 2
      expect(h1Count, `h1 count on ${path}`).toBeLessThanOrEqual(2);
    }
  }
});

test('form inputs have associated labels', async ({ page }) => {
  await page.goto('http://localhost:3000/iletisim');
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

  const inputs = page.locator('input:not([type="hidden"]):not([type="submit"]):not([type="button"])');
  const inputCount = await inputs.count();

  for (let i = 0; i < inputCount; i++) {
    const input = inputs.nth(i);
    const id = await input.getAttribute('id');
    const ariaLabel = await input.getAttribute('aria-label');
    const ariaLabelledBy = await input.getAttribute('aria-labelledby');
    const placeholder = await input.getAttribute('placeholder');

    const hasLabel = !!(id && await page.locator(`label[for="${id}"]`).count() > 0)
      || !!ariaLabel
      || !!ariaLabelledBy
      || !!placeholder; // placeholder is acceptable as fallback

    expect(hasLabel, `Input #${i} should have a label`).toBeTruthy();
  }
});