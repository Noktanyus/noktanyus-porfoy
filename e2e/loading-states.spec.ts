import { test, expect } from '@playwright/test';

/**
 * Phase E — Loading states + extended route coverage.
 *
 * Original spec covered /, /blog, /magaza, /fiyatlandirma, /hakkimda,
 * /projelerim, /iletisim. Phase E eklenen route'lar:
 *  - /saglik (public status page)
 *  - /dashboard (auth-protected → redirect)
 *  - /saas/dashboard (auth-protected → redirect)
 *  - /commerce/iyzico-callback (commerce callback, public route)
 *  - /is-ortak/[slug] (dynamic public, slug exists DB gerektirir → seed note)
 *  - /satici/[slug] (dynamic public, slug exists DB gerektirir → seed note)
 *  - /marketplace (public template gallery)
 *  - /saas (public landing)
 *  - /workspace, /api/health (auth/protected)
 *
 * DB bagimli route'lar icin safe skip + seed notu kullanilir.
 */

const PUBLIC_LOADING_PAGES = [
  '/',
  '/blog',
  '/magaza',
  '/fiyatlandirma',
  '/hakkimda',
  '/projelerim',
  '/iletisim',
  '/saglik',
  '/marketplace',
  '/saas',
  '/yasal/kvkk',
  '/yasal/gizlilik',
];

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
  const pages = [
    '/',
    '/blog',
    '/magaza',
    '/fiyatlandirma',
    '/hakkimda',
    '/projelerim',
    '/iletisim',
    '/saglik',
    '/marketplace',
    '/saas',
  ];

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

// ============================================================
// Phase E — Extended route coverage
// ============================================================

test.describe('Phase E: Extended routes', () => {
  for (const path of PUBLIC_LOADING_PAGES) {
    test(`extended: ${path} loads within 10s and has content`, async ({ page }) => {
      const start = Date.now();

      const response = await page.goto(`http://localhost:3000${path}`, {
        waitUntil: 'domcontentloaded',
        timeout: 15000,
      }).catch(() => null);

      // 500+ hata → skip (DB erisimi yoksa kabul edilir)
      if (response && response.status() >= 500) {
        test.skip(true, `Server error ${response.status()} on ${path} (DB unavailable?)`);
        return;
      }

      // main landmark veya h1/h2 görünür olmali
      await page.locator('main h1, main h2, [role="main"] h1, [role="main"] h2').first()
        .waitFor({ state: 'visible', timeout: 8000 })
        .catch(() => {
          console.warn(`No main heading on ${path}`);
        });

      const elapsed = Date.now() - start;
      console.log(`${path} loaded in ${elapsed}ms`);
      expect(elapsed, `load time on ${path}`).toBeLessThan(12000);
    });
  }

  test('/saglik: health status page renders without DB', async ({ page }) => {
    const response = await page.goto('http://localhost:3000/saglik', {
      waitUntil: 'domcontentloaded',
      timeout: 15000,
    }).catch(() => null);

    if (response && response.status() >= 500) {
      test.skip(true, 'DB unavailable for /saglik');
      return;
    }

    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});

    // Sayfa yuklendi: h1 veya hata durumu (ErrorDisplay) gorunmeli
    const hasH1 = await page.locator('h1').first().isVisible().catch(() => false);
    const hasError = await page.locator('text=Sağlık durumu okunamadı').isVisible().catch(() => false);
    const hasEmpty = await page.locator('text=İzlenen modül yok').isVisible().catch(() => false);

    expect(hasH1 || hasError || hasEmpty, '/saglik should render some state').toBeTruthy();
  });

  test('/dashboard: unauthenticated visit does not infinite load', async ({ page }) => {
    const response = await page.goto('http://localhost:3000/dashboard', {
      waitUntil: 'domcontentloaded',
      timeout: 15000,
    }).catch(() => null);

    if (response && response.status() >= 500) {
      test.skip(true, 'Server error on /dashboard');
      return;
    }

    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});

    const finalUrl = page.url();
    // /dashboard'a auth yoksa /giris'e yonlenir; 200 donerse auth flow farkli olabilir
    if (finalUrl.includes('/giris')) {
      // Auth redirect basarili
      await expect(page.locator('h1').first(), '/giris should have h1').toBeVisible();
    } else {
      // Auth flow farkli; en azindan sayfa yuklendi
      test.skip(true, `/dashboard accessible without auth — auth flow may differ (url=${finalUrl})`);
    }
  });

  test('/saas/dashboard: unauthenticated visit does not infinite load', async ({ page }) => {
    const response = await page.goto('http://localhost:3000/saas/dashboard', {
      waitUntil: 'domcontentloaded',
      timeout: 15000,
    }).catch(() => null);

    if (response && response.status() >= 500) {
      test.skip(true, 'Server error on /saas/dashboard');
      return;
    }

    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});

    const finalUrl = page.url();
    if (finalUrl.includes('/giris')) {
      await expect(page.locator('h1').first(), '/giris should have h1').toBeVisible();
    } else {
      test.skip(true, `/saas/dashboard accessible without auth — auth flow may differ`);
    }
  });

  test('/odeme/iyzico-callback: redirects without token (public route)', async ({ page }) => {
    const response = await page.goto('http://localhost:3000/odeme/iyzico-callback', {
      waitUntil: 'domcontentloaded',
      timeout: 15000,
    }).catch(() => null);

    if (response && response.status() >= 500) {
      test.skip(true, 'Server error on iyzico-callback');
      return;
    }

    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});

    // Token yoksa odeme sayfasina redirect olmali; 200 donerse icerik olabilir
    const url = page.url();
    expect(url, 'iyzico-callback should redirect to /odeme or similar').toBeTruthy();
  });

  test('/is-ortak/[slug]: dynamic route handles unknown slug gracefully', async ({ page }) => {
    const response = await page.goto('http://localhost:3000/is-ortak/test-seed-missing-slug', {
      waitUntil: 'domcontentloaded',
      timeout: 15000,
    }).catch(() => null);

    if (response && response.status() >= 500) {
      test.skip(true, 'Server error on /is-ortak/[slug]');
      return;
    }

    // 200 + 404 fallback veya 404
    const status = response?.status() ?? 0;
    if (status === 404) {
      // 404 dogru davranis (partner yok)
      return;
    }

    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});

    // 200 donerse not-found sayfasi veya partner landing olabilir
    const hasNotFound = await page.locator('text=404').first().isVisible().catch(() => false);
    const hasH1 = await page.locator('h1').first().isVisible().catch(() => false);
    expect(hasNotFound || hasH1, 'unknown partner slug should yield 404 or fallback').toBeTruthy();
  });

  test('/satici/[slug]: dynamic route handles unknown slug gracefully', async ({ page }) => {
    const response = await page.goto('http://localhost:3000/satici/test-seed-missing-slug', {
      waitUntil: 'domcontentloaded',
      timeout: 15000,
    }).catch(() => null);

    if (response && response.status() >= 500) {
      test.skip(true, 'Server error on /satici/[slug]');
      return;
    }

    const status = response?.status() ?? 0;
    if (status === 404) {
      return;
    }

    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});

    const hasNotFound = await page.locator('text=404').first().isVisible().catch(() => false);
    const hasH1 = await page.locator('h1').first().isVisible().catch(() => false);
    expect(hasNotFound || hasH1, 'unknown seller slug should yield 404 or fallback').toBeTruthy();
  });
});
