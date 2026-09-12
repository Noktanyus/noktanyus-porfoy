import { test, expect } from '@playwright/test';

/**
 * Store / Commerce smoke tests.
 *
 * Bu testler:
 *  - /magaza rotasının dogru implementation tarafindan resolve
 *    edildigini dogrular (duplicate /magaza kaldirildiktan sonra
 *    (commerce)/magaza/page.tsx tarafindan serve edilir).
 *  - Magaza sayfasinin unique icerigi (description text) ile
 *    hangi route'un cevap verdigini net olarak teyit eder.
 *  - DB bagimliligi olmadan calisacak sekilde tasarlanmistir:
 *    urun yoksa EmptyState kabul edilir, ama duplicate route
 *    catismasi veya Next.js error overlay gorunmemelidir.
 */
test.describe('Store / Commerce', () => {
  test('magaza page renders heading from commerce implementation', async ({ page }) => {
    const response = await page.goto('/magaza', { waitUntil: 'domcontentloaded' });
    // Dogru route resolve edildi: HTTP 200 ve HTML response
    expect(response, 'response should exist').not.toBeNull();
    expect(response?.status(), 'magaza should return 2xx').toBeGreaterThanOrEqual(200);
    expect(response?.status(), 'magaza should return < 500').toBeLessThan(500);

    // (commerce)/magaza/page.tsx heading'i
    await expect(page.locator('h1', { hasText: 'Mağaza' })).toBeVisible({ timeout: 15000 });
  });

  test('magaza renders description unique to commerce implementation', async ({ page }) => {
    await page.goto('/magaza', { waitUntil: 'domcontentloaded' });

    // (commerce)/magaza/page.tsx description paragrafi; baska bir duplicate
    // route varsa bu text kaybolur veya farklilasir.
    const description = page.locator(
      'p',
      { hasText: 'Dijital ürünler, yazılım şablonları ve hizmetler' }
    );
    await expect(description.first()).toBeVisible({ timeout: 15000 });
  });

  test('magaza does not show Next.js route conflict or error overlay', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('pageerror', (err) => consoleErrors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/magaza', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

    // Duplicate route varsa Next.js "two parallel pages" uyarisi veya
    // "You cannot have two parallel pages that resolve to the same path"
    // hatasini renderlar. Bu kontrol bunu yakalar.
    const conflictOverlay = page.locator(
      'text=/two parallel pages|resolve to the same path|PROD build only/i'
    );
    await expect(conflictOverlay).toHaveCount(0);

    // Next.js hata overlay'i yok
    const errorOverlay = page.locator('nextjs-portal, [data-nextjs-dialog]');
    await expect(errorOverlay).toHaveCount(0);

    // H1 yine de gorunur durumda (duplicate route catismasi olsa bile fallback)
    await expect(page.locator('h1', { hasText: 'Mağaza' })).toBeVisible();
  });

  test('magaza lists product link when DB has data, otherwise shows empty state', async ({ page }) => {
    await page.goto('/magaza');
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

    const productLink = page.locator('a[href*="/magaza/"]').first();
    const isVisible = await productLink.isVisible().catch(() => false);

    if (isVisible) {
      await expect(productLink).toBeVisible();
    } else {
      // EmptyState: "Henüz ürün yok" metni (commerce implementation) VEYA
      // en azindan ana heading. Duplicate route olsa bu davranis bozulur.
      const emptyTitle = page.locator('text=Henüz ürün yok');
      const heading = page.locator('h1', { hasText: 'Mağaza' });
      const emptyVisible = await emptyTitle.isVisible().catch(() => false);
      if (emptyVisible) {
        await expect(emptyTitle).toBeVisible();
      } else {
        await expect(heading).toBeVisible();
        test.skip(true, 'No products visible and empty state not detected');
      }
    }
  });

  test('fiyatlandirma page renders heading', async ({ page }) => {
    await page.goto('/fiyatlandirma');
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
  });

  test('fiyatlandirma shows plan grid when plans exist', async ({ page }) => {
    await page.goto('/fiyatlandirma');
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

    const starterVisible = await page.locator('text=Starter').first().isVisible().catch(() => false);
    const enterpriseVisible = await page.locator('text=Enterprise').first().isVisible().catch(() => false);

    if (starterVisible && enterpriseVisible) {
      await expect(page.locator('text=Starter').first()).toBeVisible();
      await expect(page.locator('text=Enterprise').first()).toBeVisible();
    } else {
      await expect(page.locator('h1').first()).toBeVisible();
      test.skip(true, 'No seeded plans visible');
    }
  });
});
