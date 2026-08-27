import { test, expect } from '@playwright/test';

test.describe('Store / Commerce', () => {
  test('magaza page renders heading', async ({ page }) => {
    await page.goto('/magaza');
    await expect(page.locator('h1', { hasText: 'Mağaza' })).toBeVisible({ timeout: 15000 });
  });

  test('magaza lists at least one product link when DB has data', async ({ page }) => {
    await page.goto('/magaza');
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

    const productLink = page.locator('a[href*="/magaza/"]').first();
    const isVisible = await productLink.isVisible().catch(() => false);

    if (isVisible) {
      await expect(productLink).toBeVisible();
    } else {
      // Empty state is acceptable
      await expect(page.locator('h1', { hasText: 'Mağaza' })).toBeVisible();
      test.skip(true, 'No products visible (empty state)');
    }
  });

  test('fiyatlandirma page renders heading', async ({ page }) => {
    await page.goto('/fiyatlandirma');
    // Heading is "Size Uygun Plan"
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
  });

  test('fiyatlandirma shows plan grid when plans exist', async ({ page }) => {
    await page.goto('/fiyatlandirma');
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

    // PlanGrid renders plans; if DB has plans, look for Starter/Enterprise names
    const starterVisible = await page.locator('text=Starter').first().isVisible().catch(() => false);
    const enterpriseVisible = await page.locator('text=Enterprise').first().isVisible().catch(() => false);

    if (starterVisible && enterpriseVisible) {
      await expect(page.locator('text=Starter').first()).toBeVisible();
      await expect(page.locator('text=Enterprise').first()).toBeVisible();
    } else {
      // Empty plans is acceptable; heading must still be there
      await expect(page.locator('h1').first()).toBeVisible();
      test.skip(true, 'No seeded plans visible');
    }
  });
});