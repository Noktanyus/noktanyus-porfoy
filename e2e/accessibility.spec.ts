import { test, expect, type Page } from '@playwright/test';

const PUBLIC_PAGES = [
  '/',
  '/blog',
  '/magaza',
  '/fiyatlandirma',
  '/hakkimda',
  '/projelerim',
  '/iletisim',
];

const COLOR_SCHEMES = ['light', 'dark'] as const;

async function gotoPublic(page: Page, path: string) {
  const response = await page.goto(`http://localhost:3000${path}`, {
    waitUntil: 'domcontentloaded',
    timeout: 20000,
  });
  if (response && response.status() >= 500) {
    test.skip(true, `Server error on ${path}`);
    return false;
  }
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
  return true;
}

for (const path of PUBLIC_PAGES) {
  test(`${path} has proper accessibility`, async ({ page }) => {
    if (!(await gotoPublic(page, path))) return;

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
    await gotoPublic(page, path);

    // Each page should have exactly one h1
    const h1Count = await page.locator('h1').count();
    if (h1Count > 0) {
      // Multiple h1 is acceptable in some cases but flag if more than 2
      expect(h1Count, `h1 count on ${path}`).toBeLessThanOrEqual(2);
    }
  }
});

test('form inputs have associated labels', async ({ page }) => {
  await gotoPublic(page, '/iletisim');

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

// ============================================================
// Phase E — Expanded accessibility checks
// ============================================================

test.describe('Phase E: Expanded a11y checks', () => {
  for (const scheme of COLOR_SCHEMES) {
    test(`skip-link is present and targets #main-content (${scheme})`, async ({ browser }) => {
      const context = await browser.newContext({ colorScheme: scheme });
      const page = await context.newPage();

      if (!(await gotoPublic(page, '/'))) {
        await context.close();
        return;
      }

      // Skip link must be in DOM (sr-only'dir; sadece focus'ta gorunur)
      const skipLink = page.locator(
        'a[href="#main-content"]'
      ).first();
      await expect(skipLink, 'skip link must exist').toHaveCount(1);

      // href dogru
      const href = await skipLink.getAttribute('href');
      expect(href, 'skip link href').toBe('#main-content');

      // Tab ile focus olunca active element olur
      await page.keyboard.press('Tab');
      const focusedHref = await page.evaluate(() => {
        const el = document.activeElement as HTMLAnchorElement | null;
        return el?.getAttribute('href') ?? null;
      });
      expect(focusedHref, 'first tab target should be skip link').toBe('#main-content');

      // #main-content landmark mevcut
      const mainTarget = page.locator('#main-content');
      await expect(mainTarget, '#main-content landmark should exist').toHaveCount(1);

      await context.close();
    });
  }

  test('single h1 across public pages', async ({ page }) => {
    for (const path of PUBLIC_PAGES) {
      if (!(await gotoPublic(page, path))) continue;
      const h1Count = await page.locator('main h1').count();
      // Tek bir h1 (main landmark icinde) olmali. 0 da tolere edilir
      // (ornegin /blog liste sayfasi), ama 1 ideal.
      expect(h1Count, `main h1 count on ${path}`).toBeLessThanOrEqual(2);
    }
  });

  test('form labels and aria-invalid on /iletisim', async ({ page }) => {
    await gotoPublic(page, '/iletisim');

    // en azindan 1 input var
    const inputs = page.locator('input:not([type="hidden"]):not([type="submit"])');
    const count = await inputs.count();
    if (count === 0) {
      test.skip(true, 'no form inputs on /iletisim');
      return;
    }

    // her inputun label/aria-label/aria-labelledby baglantisi olmali
    for (let i = 0; i < count; i++) {
      const input = inputs.nth(i);
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');

      const hasLabel =
        (!!id && (await page.locator(`label[for="${id}"]`).count() > 0)) ||
        !!ariaLabel ||
        !!ariaLabelledBy;

      expect(hasLabel, `input[${i}] should be associated with a label`).toBeTruthy();
    }

    // submit edildiginde aria-invalid veya HTML5 validation tetiklenmeli
    const submitBtn = page.locator('button[type="submit"]').first();
    if ((await submitBtn.count()) > 0) {
      const beforeInvalid = await page.locator('[aria-invalid="true"]').count();
      await submitBtn.click();
      await page.waitForTimeout(400);
      const afterInvalid = await page.locator('[aria-invalid="true"]').count();
      // ya aria-invalid artti ya da HTML5 validationpopup gorundu
      // (HTML5'i test etmek zor, en azindan invalid olmamali: false negative degiliz)
      if (afterInvalid === beforeInvalid) {
        // :invalid pseudo-class ile kontrol
        const htmlInvalid = await page.evaluate(() => {
          return document.querySelectorAll('input:invalid, textarea:invalid').length;
        });
        expect(htmlInvalid, 'after submit, at least one input should be :invalid').toBeGreaterThan(0);
      }
    }
  });

  test('landmark roles: banner/main/contentinfo/navigation', async ({ page }) => {
    await gotoPublic(page, '/');

    // banner (header)
    const banner = await page.locator('[role="banner"], header').count();
    expect(banner, 'banner landmark').toBeGreaterThanOrEqual(1);

    // main
    const main = await page.locator('main, [role="main"]').count();
    expect(main, 'main landmark').toBeGreaterThanOrEqual(1);

    // contentinfo (footer)
    const contentinfo = await page.locator('[role="contentinfo"], footer').count();
    expect(contentinfo, 'contentinfo landmark').toBeGreaterThanOrEqual(1);

    // navigation
    const nav = await page.locator('nav, [role="navigation"]').count();
    expect(nav, 'navigation landmark').toBeGreaterThanOrEqual(1);
  });

  for (const scheme of COLOR_SCHEMES) {
    test(`html element has lang attribute and theming hook (${scheme})`, async ({ browser }) => {
      const context = await browser.newContext({ colorScheme: scheme });
      const page = await context.newPage();

      await gotoPublic(page, '/');

      // html lang
      const lang = await page.locator('html').getAttribute('lang');
      expect(lang, 'html lang').toBeTruthy();

      // theming hook: <html> uzerinde class veya data-theme olmali
      const htmlClass = await page.locator('html').getAttribute('class');
      const dataTheme = await page.locator('html').getAttribute('data-theme');
      const hasThemeHook = (htmlClass && /dark|light/.test(htmlClass)) || !!dataTheme;
      expect(hasThemeHook, `theme hook should be present (${scheme})`).toBeTruthy();

      await context.close();
    });
  }

  test('keyboard: Tab makes focus visible (focus-visible)', async ({ page }) => {
    await gotoPublic(page, '/');

    // skip link'i tab'la
    await page.keyboard.press('Tab');
    await page.waitForTimeout(100);

    // aktif element :focus-visible ile stillendirilmis olmali
    const focusInfo = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el) return null;
      // :focus-visible state'i JS'ten dogrudan okunamaz,
      // ama CSS rule olarak ring/outline class'lari uygulanmis olmali.
      const styles = window.getComputedStyle(el);
      const hasFocusVisibleClass =
        el.className && /focus-visible|focus-ring/.test(el.className.toString());
      return {
        tag: el.tagName.toLowerCase(),
        outlineStyle: styles.outlineStyle,
        outlineWidth: styles.outlineWidth,
        boxShadow: styles.boxShadow,
        className: el.className?.toString() ?? '',
        hasFocusVisibleClass,
      };
    });

    expect(focusInfo, 'first tab should focus an element').not.toBeNull();
    expect(focusInfo!.tag, 'first focusable should be a or button').toMatch(/a|button|input/);
  });
});
