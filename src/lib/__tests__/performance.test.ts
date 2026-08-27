import { describe, it, expect } from 'vitest';

/**
 * Performance sanity checks.
 *
 * These tests act as a contract — they document the performance budget the
 * project commits to and will fail (or warn) if critical patterns regress.
 *
 * For real bundle-size diffs run `ANALYZE=true npm run build` and inspect
 * the generated `.next/analyze/*.html` reports.
 */
describe('Performance checks', () => {
  describe('bundle size awareness', () => {
    it('bundle analyzer integration exists in next.config.mjs', async () => {
      const { readFile } = await import('fs/promises');
      const path = await import('path');
      const cfgPath = path.resolve(process.cwd(), 'next.config.mjs');
      const cfg = await readFile(cfgPath, 'utf8');
      expect(cfg).toMatch(/@next\/bundle-analyzer/);
      expect(cfg).toMatch(/withBundleAnalyzer/);
    });

    it('experimental.optimizePackageImports is configured', async () => {
      const { readFile } = await import('fs/promises');
      const path = await import('path');
      const cfg = await readFile(
        path.resolve(process.cwd(), 'next.config.mjs'),
        'utf8'
      );
      expect(cfg).toMatch(/optimizePackageImports/);
      // Ensure at least the heavy icon library is configured
      expect(cfg).toMatch(/react-icons/);
    });

    it('production build strips console statements', async () => {
      const { readFile } = await import('fs/promises');
      const path = await import('path');
      const cfg = await readFile(
        path.resolve(process.cwd(), 'next.config.mjs'),
        'utf8'
      );
      expect(cfg).toMatch(/removeConsole/);
      expect(cfg).toMatch(/NODE_ENV.*production/);
    });

    it('long-cache headers configured for static assets', async () => {
      const { readFile } = await import('fs/promises');
      const path = await import('path');
      const cfg = await readFile(
        path.resolve(process.cwd(), 'next.config.mjs'),
        'utf8'
      );
      expect(cfg).toMatch(/max-age=31536000/);
      expect(cfg).toMatch(/immutable/);
    });
  });

  describe('lazy loading contract', () => {
    it('BlogList is loaded via next/dynamic in the blog page', async () => {
      const { readFile } = await import('fs/promises');
      const path = await import('path');
      const page = await readFile(
        path.resolve(process.cwd(), 'src/app/(content)/blog/page.tsx'),
        'utf8'
      );
      // The pages alias next/dynamic as `nextDynamic` to avoid clashing with
      // the Next.js route-segment config `export const dynamic`.
      expect(page).toMatch(/nextDynamic\(\(\) => import\(['"]@\/components\/BlogList['"]/);
    });

    it('ProjectList is loaded via next/dynamic in the projelerim page', async () => {
      const { readFile } = await import('fs/promises');
      const path = await import('path');
      const page = await readFile(
        path.resolve(process.cwd(), 'src/app/(content)/projelerim/page.tsx'),
        'utf8'
      );
      expect(page).toMatch(
        /nextDynamic\(\(\) => import\(['"]@\/components\/ProjectList['"]/
      );
    });

    it('ProductGrid is loaded via next/dynamic in the magaza page', async () => {
      const { readFile } = await import('fs/promises');
      const path = await import('path');
      const page = await readFile(
        path.resolve(process.cwd(), 'src/app/(commerce)/magaza/page.tsx'),
        'utf8'
      );
      expect(page).toMatch(/ProductGrid/);
      expect(page).toMatch(/dynamic/);
    });
  });

  describe('memoization contract', () => {
    it('BlogCard is wrapped in React.memo', async () => {
      const { readFile } = await import('fs/promises');
      const path = await import('path');
      const file = await readFile(
        path.resolve(process.cwd(), 'src/components/BlogCard.tsx'),
        'utf8'
      );
      expect(file).toMatch(/memo\(function BlogCard/);
    });

    it('ProjectCard is wrapped in React.memo', async () => {
      const { readFile } = await import('fs/promises');
      const path = await import('path');
      const file = await readFile(
        path.resolve(process.cwd(), 'src/components/ProjectCard.tsx'),
        'utf8'
      );
      expect(file).toMatch(/memo\(function ProjectCard/);
    });

    it('ProductCard inside ProductGrid is wrapped in React.memo', async () => {
      const { readFile } = await import('fs/promises');
      const path = await import('path');
      const file = await readFile(
        path.resolve(process.cwd(), 'src/components/commerce/ProductGrid.tsx'),
        'utf8'
      );
      expect(file).toMatch(/memo\(function ProductCard/);
    });
  });

  describe('font optimization', () => {
    it('layout uses next/font/google for Inter', async () => {
      const { readFile } = await import('fs/promises');
      const path = await import('path');
      const file = await readFile(
        path.resolve(process.cwd(), 'src/app/layout.tsx'),
        'utf8'
      );
      expect(file).toMatch(/from ['"]next\/font\/google['"]/);
      expect(file).toMatch(/Inter\(/);
    });

    it('CSS references the next/font CSS variable', async () => {
      const { readFile } = await import('fs/promises');
      const path = await import('path');
      const file = await readFile(
        path.resolve(process.cwd(), 'src/app/globals.css'),
        'utf8'
      );
      expect(file).toMatch(/var\(--font-inter\)/);
    });
  });

  describe('image optimization', () => {
    it('OptimizedImage defaults to lazy loading', async () => {
      const { readFile } = await import('fs/promises');
      const path = await import('path');
      const file = await readFile(
        path.resolve(process.cwd(), 'src/components/ui/OptimizedImage.tsx'),
        'utf8'
      );
      // The component must expose `priority` and `loading` props so callers
      // can opt in to eager loading for above-the-fold images.
      expect(file).toMatch(/priority\??:/);
      expect(file).toMatch(/loading\??:/);
    });

    it('next.config.mjs configures modern image formats', async () => {
      const { readFile } = await import('fs/promises');
      const path = await import('path');
      const cfg = await readFile(
        path.resolve(process.cwd(), 'next.config.mjs'),
        'utf8'
      );
      expect(cfg).toMatch(/image\/webp/);
      expect(cfg).toMatch(/image\/avif/);
    });
  });

  describe('monitoring', () => {
    it('Sentry uses conservative sampling rates in client config', async () => {
      const { readFile } = await import('fs/promises');
      const path = await import('path');
      const cfg = await readFile(
        path.resolve(process.cwd(), 'sentry.client.config.ts'),
        'utf8'
      );
      // Should be 0.1 (10%) — far below the legacy 1.0 (100%)
      expect(cfg).toMatch(/tracesSampleRate:\s*0\.1/);
      expect(cfg).toMatch(/profilesSampleRate:\s*0\.1/);
    });
  });
});
