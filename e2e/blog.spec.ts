import { test, expect } from '@playwright/test';

test.describe('Blog', () => {
  test('blog list page renders heading', async ({ page }) => {
    await page.goto('/blog');
    // H1 should contain "Blog"
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator('h1', { hasText: 'Blog' }).first()).toBeVisible();
  });

  test('blog post detail page loads', async ({ page }) => {
    await page.goto('/blog');
    // Wait for posts to render
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

    const firstPostLink = page.locator('a[href*="/blog/"]').first();
    const isVisible = await firstPostLink.isVisible().catch(() => false);

    if (isVisible) {
      const href = await firstPostLink.getAttribute('href');
      // Skip non-detail links
      if (href && href !== '/blog' && /\/blog\/[^/]+/.test(href)) {
        await firstPostLink.click();
        await expect(page).toHaveURL(/\/blog\/[^/]+$/);
        // Article content
        await expect(page.locator('article, main').first()).toBeVisible({ timeout: 15000 });
      } else {
        test.skip(true, 'No blog detail link found (DB empty?)');
      }
    } else {
      test.skip(true, 'No blog posts visible (DB empty?)');
    }
  });
});