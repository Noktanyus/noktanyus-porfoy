import { test, expect } from '@playwright/test';

test.describe('Auth Pages', () => {
  test('register page renders form', async ({ page }) => {
    await page.goto('/kayit');
    await expect(page.locator('h1', { hasText: 'Hesap Oluştur' })).toBeVisible({ timeout: 10000 });
    await expect(page.locator('input[type="email"]')).toBeVisible();
    // Registration form should have password + confirm password (>= 2)
    const passwordInputs = page.locator('input[type="password"]');
    await expect(passwordInputs).toHaveCount(2);
  });

  test('login page renders form', async ({ page }) => {
    await page.goto('/giris');
    await expect(page.locator('h1', { hasText: 'Giriş Yap' })).toBeVisible({ timeout: 10000 });
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('dashboard requires auth and redirects to /giris', async ({ page }) => {
    await page.goto('/dashboard');
    // Server-side redirect via Next.js redirect() should land on /giris
    await expect(page).toHaveURL(/\/giris(\?|$)/, { timeout: 15000 });
  });

  test('admin requires auth and redirects', async ({ page }) => {
    await page.goto('/admin');
    // Admin layout/middleware should redirect unauthenticated users
    // Final URL could be /giris or another auth route
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    const url = page.url();
    expect(url).not.toMatch(/\/admin$/);
  });

  test('register → login navigation link works', async ({ page }) => {
    await page.goto('/kayit');
    const loginLink = page.locator('a', { hasText: 'Giriş Yap' }).first();
    await expect(loginLink).toBeVisible();
    await loginLink.click();
    await expect(page).toHaveURL(/\/giris$/);
  });
});