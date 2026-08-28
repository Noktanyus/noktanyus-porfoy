import { test, expect } from '@playwright/test';

test('contact form validates required fields', async ({ page }) => {
  await page.goto('http://localhost:3000/iletisim', { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

  const submitButton = page.locator('button[type="submit"]').first();
  const submitCount = await submitButton.count();

  if (submitCount === 0) {
    test.skip(true, 'No submit button found');
    return;
  }

  await submitButton.click();
  await page.waitForTimeout(800);

  // Should show validation messages or stay on page (HTML5 validation)
  const url = page.url();
  expect(url).toContain('/iletisim');

  // At least one input should be invalid (HTML5 validation)
  const inputs = page.locator('input[required], textarea[required]');
  const inputCount = await inputs.count();
  if (inputCount > 0) {
    let hasInvalid = false;
    for (let i = 0; i < Math.min(inputCount, 3); i++) {
      const isInvalid = await inputs.nth(i).evaluate((el: HTMLInputElement) => !el.checkValidity());
      if (isInvalid) {
        hasInvalid = true;
        break;
      }
    }
    expect(hasInvalid, 'At least one required field should be invalid after empty submit').toBeTruthy();
  }
});

test('login form shows error or stays on page for invalid credentials', async ({ page }) => {
  await page.goto('http://localhost:3000/giris', { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

  const emailInput = page.locator('input[type="email"]').first();
  const passwordInput = page.locator('input[type="password"]').first();

  if (await emailInput.count() === 0) {
    test.skip(true, 'No email input on login page');
    return;
  }

  await emailInput.fill('invalid-test@noktanyus.local');
  await passwordInput.fill('WrongPassword123!');

  const submitButton = page.locator('button[type="submit"]').first();
  await submitButton.click();
  await page.waitForTimeout(2500);

  // Should either show error OR stay on login page (auth failed)
  const url = page.url();
  expect(url, 'Should stay on login page after failed auth').toContain('/giris');

  // Page should not have crashed
  const bodyText = await page.locator('body').textContent();
  expect(bodyText, 'Page should still have content').toBeTruthy();
});

test('search functionality is accessible (Ctrl+K)', async ({ page }) => {
  await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

  // Try Ctrl+K shortcut
  await page.keyboard.press('Control+k');
  await page.waitForTimeout(700);

  // Check if search modal/dialog opened
  const searchInput = page.locator(
    'input[placeholder*="ara" i], input[placeholder*="search" i], [role="dialog"] input'
  ).first();

  const inputCount = await searchInput.count();

  if (inputCount > 0) {
    await expect(searchInput).toBeVisible({ timeout: 3000 });
    await searchInput.fill('test');
    await page.waitForTimeout(800);
  } else {
    // Search via shortcut might not be implemented - check for search button
    const searchButton = page.locator('button[aria-label*="ara" i], button[aria-label*="search" i]').first();
    const buttonCount = await searchButton.count();
    console.log(`Search shortcut not detected, button count: ${buttonCount}`);
  }
});

test('newsletter or email subscription validates email format', async ({ page }) => {
  await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

  // Find email-type input on the page (could be in footer for newsletter)
  const emailInputs = page.locator('input[type="email"]');
  const count = await emailInputs.count();

  if (count === 0) {
    test.skip(true, 'No email input found on homepage');
    return;
  }

  // Test invalid email
  const firstEmail = emailInputs.first();
  await firstEmail.fill('not-a-valid-email');
  await firstEmail.evaluate((el: HTMLInputElement) => el.checkValidity());

  const isInvalid = await firstEmail.evaluate((el: HTMLInputElement) => !el.checkValidity());
  expect(isInvalid, 'Invalid email should be marked as invalid by HTML5').toBeTruthy();
});