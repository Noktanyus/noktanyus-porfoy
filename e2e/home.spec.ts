import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('homepage loads with hero and featured sections', async ({ page }) => {
    await page.goto('/');

    // Hero section
    await expect(page).toHaveTitle(/Noktanyus|Yunus|Portfolio|Ana Sayfa/i);

    // Static section headings (always rendered)
    await expect(page.locator('h2', { hasText: 'Öne Çıkan Projeler' })).toBeVisible({ timeout: 15000 });
    await expect(page.locator('h2', { hasText: 'Son Blog Yazıları' })).toBeVisible({ timeout: 15000 });
  });

  test('navigation link to Projelerim works', async ({ page }) => {
    await page.goto('/');
    // Header link with text "Projelerim"
    const projelerimLink = page.locator('header a', { hasText: 'Projelerim' }).first();
    await expect(projelerimLink).toBeVisible();
    await projelerimLink.click();
    await expect(page).toHaveURL(/\/projelerim$/);
    await expect(page.locator('h1', { hasText: 'Projelerim' })).toBeVisible();
  });

  test('homepage has accessible language attribute', async ({ page }) => {
    await page.goto('/');
    const html = page.locator('html');
    await expect(html).toHaveAttribute('lang', 'tr');
  });
});