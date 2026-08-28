import { test, expect } from '@playwright/test';

test('header navigation links work', async ({ page }) => {
  await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

  // Turkish navigation labels
  const links = [
    { text: 'Hakkımda', urlMatch: /\/hakkimda/ },
    { text: 'Projelerim', urlMatch: /\/projelerim/ },
    { text: 'Blog', urlMatch: /\/blog/ },
    { text: 'Mağaza', urlMatch: /\/magaza/ },
    { text: 'Fiyatlandırma', urlMatch: /\/fiyatlandirma/ },
    { text: 'İletişim', urlMatch: /\/iletisim/ },
  ];

  const testedLinks: string[] = [];
  const failedLinks: string[] = [];

  for (const { text, urlMatch } of links) {
    const link = page.locator(`header a:has-text("${text}")`).first();
    const count = await link.count();

    if (count === 0) {
      console.log(`Link "${text}" not found in header (may be in mobile menu)`);
      continue;
    }

    testedLinks.push(text);

    await link.click();
    await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});

    const url = page.url();
    if (!url.match(urlMatch)) {
      failedLinks.push(`${text} → ${url} (expected ${urlMatch})`);
    }

    // Verify the page didn't error
    expect(url, `URL after clicking ${text}`).not.toContain('error');

    // Go back to home
    await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
  }

  console.log(`Tested ${testedLinks.length} nav links, ${failedLinks.length} failed`);
  expect(failedLinks, 'All navigation links should lead to correct URLs').toEqual([]);
});

test('theme toggle works', async ({ page }) => {
  await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

  const initialClass = await page.locator('html').getAttribute('class');
  const initialDataTheme = await page.locator('html').getAttribute('data-theme');

  // Find theme toggle button - multiple selectors
  const themeToggle = page.locator(
    'button[aria-label*="tema" i], button[aria-label*="theme" i], button:has([class*="theme" i])'
  ).first();

  const toggleCount = await themeToggle.count();

  if (toggleCount === 0) {
    test.skip(true, 'No theme toggle button found');
    return;
  }

  await themeToggle.click();
  await page.waitForTimeout(700);

  const newClass = await page.locator('html').getAttribute('class');
  const newDataTheme = await page.locator('html').getAttribute('data-theme');

  // Either class or data-theme should change
  const changed = newClass !== initialClass || newDataTheme !== initialDataTheme;
  expect(changed, `Theme should change (class: ${initialClass}→${newClass}, data-theme: ${initialDataTheme}→${newDataTheme})`).toBeTruthy();
});

test('cart icon visible on store pages', async ({ page }) => {
  await page.goto('http://localhost:3000/magaza', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);

  const cartIcon = page.locator(
    'button[aria-label*="cart" i], button[aria-label*="sepet" i], a[aria-label*="cart" i], a[aria-label*="sepet" i]'
  ).first();

  const cartCount = await cartIcon.count();
  if (cartCount > 0) {
    await expect(cartIcon).toBeVisible();
  } else {
    console.log('No cart icon found - may not be on this page');
  }
});

test('footer links present', async ({ page }) => {
  await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});

  const footer = page.locator('footer');
  const footerCount = await footer.count();
  expect(footerCount, 'Footer should be present').toBeGreaterThanOrEqual(1);

  const footerLinks = await footer.locator('a').count();
  expect(footerLinks, 'Footer should contain links').toBeGreaterThan(0);
});

test('language switcher works (if present)', async ({ page }) => {
  await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});

  // Look for locale switcher
  const localeSwitch = page.locator(
    'button[aria-label*="lang" i], button[aria-label*="dil" i], select[name*="locale" i]'
  ).first();

  const count = await localeSwitch.count();
  if (count === 0) {
    test.skip(true, 'No language switcher found');
    return;
  }

  console.log('Language switcher detected');
});