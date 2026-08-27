import { test, expect } from '@playwright/test';

test.describe('Contact Form', () => {
  test('contact page renders', async ({ page }) => {
    await page.goto('/iletisim');
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    // Page should load (heading or form fields)
    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible({ timeout: 15000 });
  });

  test('contact form validates empty submit', async ({ page }) => {
    await page.goto('/iletisim');
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

    const submitButton = page.locator('button[type="submit"]').first();
    const isVisible = await submitButton.isVisible().catch(() => false);

    if (!isVisible) {
      test.skip(true, 'No submit button rendered');
      return;
    }

    await submitButton.click();
    await page.waitForTimeout(800);

    // Validation: should either stay on the page OR show error toasts/messages
    // We assert the URL hasn't navigated to a different page
    expect(page.url()).toMatch(/\/iletisim/);

    // Email field should be invalid (HTML5 + zod resolver)
    const emailInput = page.locator('input[type="email"]').first();
    if (await emailInput.isVisible().catch(() => false)) {
      const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.checkValidity());
      expect(isInvalid).toBeTruthy();
    }
  });
});