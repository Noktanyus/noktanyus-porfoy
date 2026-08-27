import { test, expect } from '@playwright/test';

const legalPages = [
  { url: '/yasal/kvkk', title: 'KVKK' },
  { url: '/yasal/mesafeli-satis', title: 'Mesafeli Satış' },
  { url: '/yasal/cerez-politikasi', title: 'Çerez Politikası' },
  { url: '/yasal/cayma-hakki', title: 'Cayma Hakkı' },
  { url: '/yasal/gizlilik', title: 'Gizlilik Politikası' },
];

test.describe('Legal Pages', () => {
  for (const p of legalPages) {
    test(`legal page ${p.url} renders expected H1`, async ({ page }) => {
      await page.goto(p.url);
      const h1 = page.locator('h1').first();
      await expect(h1).toBeVisible({ timeout: 15000 });
      // Use toContainText (not strict match) so we tolerate suffix differences
      await expect(h1).toContainText(p.title, { ignoreCase: true });
    });
  }
});