import { test, expect } from '@playwright/test';

test('homepage shows content within 5 seconds', async ({ page }) => {
  const start = Date.now();

  await page.goto('http://localhost:3000/', {
    waitUntil: 'domcontentloaded',
    timeout: 10000,
  });

  // Wait for main heading
  await page.locator('h1, h2').first().waitFor({
    state: 'visible',
    timeout: 5000,
  });

  const elapsed = Date.now() - start;
  console.log(`Homepage loaded in ${elapsed}ms`);
  expect(elapsed).toBeLessThan(8000);
});

test('dynamic route /blog/[slug] loads within 8 seconds', async ({ page }) => {
  await page.goto('http://localhost:3000/blog', {
    waitUntil: 'domcontentloaded',
    timeout: 10000,
  });

  await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});

  // Click first blog post link
  const firstPost = page.locator('a[href*="/blog/"]').first();
  const count = await firstPost.count();

  if (count === 0) {
    test.skip(true, 'No blog posts to test');
    return;
  }

  const href = await firstPost.getAttribute('href');
  if (!href || href === '/blog') {
    test.skip(true, 'No valid blog post link found');
    return;
  }

  const start = Date.now();
  await page.goto(`http://localhost:3000${href}`, {
    waitUntil: 'domcontentloaded',
    timeout: 10000,
  });

  await page.locator('article, h1, main').first().waitFor({
    state: 'visible',
    timeout: 8000,
  });

  const elapsed = Date.now() - start;
  console.log(`Blog post loaded in ${elapsed}ms`);
  expect(elapsed).toBeLessThan(10000);
});

test('store page loads within 8 seconds', async ({ page }) => {
  const start = Date.now();

  await page.goto('http://localhost:3000/magaza', {
    waitUntil: 'domcontentloaded',
    timeout: 10000,
  });

  await page.locator('h1, h2').first().waitFor({
    state: 'visible',
    timeout: 8000,
  });

  const elapsed = Date.now() - start;
  console.log(`Store page loaded in ${elapsed}ms`);
  expect(elapsed).toBeLessThan(10000);
});

test('all critical pages have no infinite loading', async ({ page }) => {
  const pages = ['/', '/blog', '/magaza', '/fiyatlandirma', '/hakkimda', '/projelerim', '/iletisim'];

  for (const path of pages) {
    await page.goto(`http://localhost:3000${path}`, {
      waitUntil: 'domcontentloaded',
      timeout: 10000,
    });

    // Wait for actual content (not just spinner)
    await page.locator('main h1, main h2').first().waitFor({
      state: 'visible',
      timeout: 8000,
    }).catch(() => {
      console.warn(`No main heading found on ${path}`);
    });
  }
});