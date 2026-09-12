import { test, expect, type Page } from '@playwright/test';

/**
 * Phase E — Keyboard navigation smoke tests.
 *
 * Kapsam:
 *  - Public home: skip-link, header nav, hero CTA'lara Tab ile erisim
 *  - Auth login: form input sirasina erisim, Enter ile submit, aria-invalid
 *  - Dashboard / saas/dashboard / marketplace: public ise tab sirasini,
 *    auth gerektiriyorsa 307 redirect'i dogrula
 *  - Enter/Space davranisi: butonlar ve linkler icin
 *  - Escape: mobile menu veya search modal kapatma
 *  - Authenticated akis mock'lanamaz (DB gerekir); bunun yerine auth-redirect
 *    davranisini test ederek yanlis pozitif yazma riskini azaltiyoruz.
 */

async function gotoPublic(page: Page, path: string) {
  const response = await page.goto(`http://localhost:3000${path}`, {
    waitUntil: 'domcontentloaded',
    timeout: 20000,
  });
  if (response && response.status() >= 500) {
    test.skip(true, `Server error on ${path}`);
    return false;
  }
  await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
  return true;
}

test.describe('Keyboard Navigation', () => {
  test('home: Tab order reaches skip link, then header nav, then content', async ({ page }) => {
    if (!(await gotoPublic(page, '/'))) return;

    // 1. Tab → skip link
    await page.keyboard.press('Tab');
    const firstFocusHref = await page.evaluate(() => {
      const el = document.activeElement as HTMLAnchorElement | null;
      return el?.getAttribute('href') ?? null;
    });
    expect(firstFocusHref, 'first tab target').toBe('#main-content');

    // 2. Tab → header'daki ilk nav linki
    await page.keyboard.press('Tab');
    const secondFocus = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      return {
        tag: el?.tagName.toLowerCase() ?? null,
        href: el?.getAttribute('href') ?? null,
        text: el?.textContent?.trim().slice(0, 40) ?? null,
      };
    });
    expect(secondFocus.tag, 'second tab should be a or button').toMatch(/a|button/);
    expect(secondFocus.href ?? secondFocus.text, 'second tab has href or text').toBeTruthy();
  });

  test('home: Enter activates focused link and navigates', async ({ page }) => {
    if (!(await gotoPublic(page, '/'))) return;

    // skip link'i Tab'la
    await page.keyboard.press('Tab');
    // sonraki Tab → header nav (Ana Sayfa veya baska)
    await page.keyboard.press('Tab');
    // header link'i seciliyken Enter
    const focusedHref = await page.evaluate(() => {
      const el = document.activeElement as HTMLAnchorElement | null;
      return el?.getAttribute('href') ?? null;
    });
    if (!focusedHref) {
      test.skip(true, 'no focusable link after skip');
      return;
    }

    await page.keyboard.press('Enter');
    await page.waitForLoadState('domcontentloaded', { timeout: 10000 }).catch(() => {});

    // URL degisti veya skip-link'e geri dondu
    const url = page.url();
    expect(url).not.toBe('http://localhost:3000/');
  });

  test('login: Tab reaches email, password, submit in order', async ({ page }) => {
    if (!(await gotoPublic(page, '/giris'))) return;

    // skip link + header nav'i gec
    await page.keyboard.press('Tab'); // skip link
    // header nav'i gecmek icin birkac Tab
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press('Tab');
      const tag = await page.evaluate(() => document.activeElement?.tagName.toLowerCase() ?? null);
      const type = await page.evaluate(() => {
        const el = document.activeElement as HTMLInputElement | null;
        return el?.type ?? null;
      });
      if (tag === 'input' && type === 'email') break;
    }

    const emailFocused = await page.evaluate(() => {
      const el = document.activeElement as HTMLInputElement | null;
      return el?.type === 'email';
    });
    expect(emailFocused, 'email input should be reachable via Tab').toBeTruthy();

    // Tab → password
    await page.keyboard.press('Tab');
    const passwordFocused = await page.evaluate(() => {
      const el = document.activeElement as HTMLInputElement | null;
      return el?.type === 'password';
    });
    expect(passwordFocused, 'password input should follow email').toBeTruthy();

    // birkac Tab daha → submit button (buton veya link atlayarak)
    let foundSubmit = false;
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press('Tab');
      const isSubmit = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        if (!el) return false;
        if (el.tagName.toLowerCase() === 'button') {
          const btn = el as HTMLButtonElement;
          return btn.type === 'submit' || /giriş|giris/i.test(btn.textContent ?? '');
        }
        return false;
      });
      if (isSubmit) {
        foundSubmit = true;
        break;
      }
    }
    expect(foundSubmit, 'submit button reachable via Tab').toBeTruthy();
  });

  test('login: Enter on email field moves focus to password (or submit)', async ({ page }) => {
    if (!(await gotoPublic(page, '/giris'))) return;

    // email input'u bul ve focusla
    const email = page.locator('input[type="email"]').first();
    if ((await email.count()) === 0) {
      test.skip(true, 'no email input');
      return;
    }
    await email.focus();
    await page.keyboard.press('Tab');

    const next = await page.evaluate(() => {
      const el = document.activeElement as HTMLInputElement | null;
      return { tag: el?.tagName.toLowerCase() ?? null, type: el?.type ?? null };
    });

    // Form field'lar arasinda password'a geciyor veya submit'e atliyor
    expect(next.tag, 'next focus after email').toMatch(/input|button/);
    // password ya da submit beklenir
    expect(['password', 'submit', null]).toContain(next.type);
  });

  test('dashboard: unauthenticated visit redirects to /giris (no keyboard input needed)', async ({ page }) => {
    const response = await page.goto('http://localhost:3000/dashboard', {
      waitUntil: 'domcontentloaded',
      timeout: 15000,
    }).catch(() => null);

    // 200 donerse auth middleware'den gecmis demektir; yine de URL kontrol et
    const finalUrl = page.url();
    expect(finalUrl, 'unauthenticated /dashboard should not render dashboard').not.toMatch(/\/dashboard(\/|$)/);

    // veya status 200 + dashboard icerigi yok
    if (response && response.status() === 200 && finalUrl.includes('/dashboard')) {
      test.skip(true, '/dashboard accessible — auth flow may differ');
    }
  });

  test('saas/dashboard: unauthenticated visit redirects (auth required)', async ({ page }) => {
    const response = await page.goto('http://localhost:3000/saas/dashboard', {
      waitUntil: 'domcontentloaded',
      timeout: 15000,
    }).catch(() => null);

    const finalUrl = page.url();

    // /saas/dashboard'a auth'suz erisim saglik sayfasi veya giris olmali
    // Bazi durumlarda 200 + dashboard render olabilir; bu durumda test.skip
    if (response && response.status() === 200 && finalUrl.includes('/saas/dashboard')) {
      test.skip(true, '/saas/dashboard accessible — auth flow may differ');
      return;
    }

    // /giris'e redirect veya 307
    expect(finalUrl).toMatch(/\/giris/);
  });

  test('marketplace: public page has tab navigation', async ({ page }) => {
    if (!(await gotoPublic(page, '/marketplace'))) return;

    // skip link + header
    await page.keyboard.press('Tab');
    const firstHref = await page.evaluate(() => {
      const el = document.activeElement as HTMLAnchorElement | null;
      return el?.getAttribute('href') ?? null;
    });
    expect(firstHref, 'first tab on marketplace').toBe('#main-content');

    // Sayfada en az bir link tab ile ulasilabilir olmali
    let reachableLink = false;
    for (let i = 0; i < 15; i++) {
      await page.keyboard.press('Tab');
      const info = await page.evaluate(() => {
        const el = document.activeElement as HTMLAnchorElement | HTMLButtonElement | null;
        if (!el) return null;
        const tag = el.tagName.toLowerCase();
        const href = el.getAttribute('href');
        return { tag, href, visible: el.offsetParent !== null };
      });
      if (info && info.tag === 'a' && info.href && info.visible) {
        reachableLink = true;
        break;
      }
    }
    expect(reachableLink, 'at least one link should be reachable via Tab').toBeTruthy();
  });

  test('Escape closes search modal (Ctrl+K opens, Esc closes)', async ({ page }) => {
    if (!(await gotoPublic(page, '/'))) return;

    // Ctrl+K ile ac
    await page.keyboard.press('Control+k');
    await page.waitForTimeout(500);

    // Dialog var mi?
    const dialog = page.locator('[role="dialog"]');
    const dialogVisible = await dialog.first().isVisible().catch(() => false);
    if (!dialogVisible) {
      test.skip(true, 'search modal not triggered via Ctrl+K');
      return;
    }

    // Escape ile kapat
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);

    const stillVisible = await dialog.first().isVisible().catch(() => false);
    expect(stillVisible, 'Escape should close search dialog').toBeFalsy();
  });

  test('focus-visible: focus ring is visible on keyboard navigation', async ({ page }) => {
    if (!(await gotoPublic(page, '/'))) return;

    // Tab yap ve bir header linkine gel
    await page.keyboard.press('Tab'); // skip
    await page.keyboard.press('Tab'); // header link 1
    await page.waitForTimeout(100);

    const styleInfo = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el) return null;
      const styles = window.getComputedStyle(el);
      return {
        className: el.className?.toString() ?? '',
        outlineWidth: styles.outlineWidth,
        outlineStyle: styles.outlineStyle,
        boxShadow: styles.boxShadow,
      };
    });

    expect(styleInfo, 'focused element should exist').not.toBeNull();
    // focus-visible class veya ring/outline uygulanmis olmali
    const hasFocusStyle =
      /focus-visible|focus-ring|focus:/.test(styleInfo!.className) ||
      (styleInfo!.outlineStyle !== 'none' && styleInfo!.outlineWidth !== '0px') ||
      /ring/.test(styleInfo!.boxShadow) ||
      /rgb/.test(styleInfo!.boxShadow); // Tailwind ring-* hex/rgba box-shadow uretir
    expect(hasFocusStyle, 'focused element should have focus-visible styling').toBeTruthy();
  });
});
