/**
 * adminNavLinks — Unit Test
 *
 * `resolveActiveHref` admin sidebar ve mobil breadcrumb tarafından PAYLAŞILIR.
 * Bu test iki eski hatanın geri gelmemesini garanti eder:
 *
 *   1. `pathname.startsWith(href)` alt sayfalarda birden fazla linki aktif
 *      gösteriyordu (/admin/blog/scheduled hem "Blog" hem "Taslaklar").
 *   2. Segment sınırı kontrol edilmediği için /admin/blogxyz gibi yollar
 *      /admin/blog ile eşleşiyordu.
 */

import { describe, it, expect } from 'vitest';
import { ADMIN_NAV_LINKS, resolveActiveHref } from '../adminNavLinks';

describe('ADMIN_NAV_LINKS', () => {
  it('has no duplicate hrefs', () => {
    const hrefs = ADMIN_NAV_LINKS.map((l) => l.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it('points every link under /admin', () => {
    for (const link of ADMIN_NAV_LINKS) {
      expect(link.href.startsWith('/admin/')).toBe(true);
    }
  });

  it('gives every link a non-empty label', () => {
    for (const link of ADMIN_NAV_LINKS) {
      expect(link.text.trim().length).toBeGreaterThan(0);
    }
  });
});

describe('resolveActiveHref', () => {
  it('matches an exact path', () => {
    expect(resolveActiveHref('/admin/blog')).toBe('/admin/blog');
  });

  it('prefers the longest match for nested routes', () => {
    // Regression #1: iki link birden aktif olmamali
    expect(resolveActiveHref('/admin/blog/scheduled')).toBe('/admin/blog/scheduled');
    expect(resolveActiveHref('/admin/newsletter/broadcast')).toBe(
      '/admin/newsletter/broadcast',
    );
  });

  it('falls back to the parent for unlisted sub-routes', () => {
    expect(resolveActiveHref('/admin/blog/edit/merhaba-dunya')).toBe('/admin/blog');
    expect(resolveActiveHref('/admin/products/new')).toBe('/admin/products');
  });

  it('respects segment boundaries', () => {
    // Regression #2: /admin/blogxyz, /admin/blog ile eslesmemeli
    expect(resolveActiveHref('/admin/blogxyz')).toBeNull();
  });

  it('returns null for unknown paths', () => {
    expect(resolveActiveHref('/admin/bilinmeyen-sayfa')).toBeNull();
    expect(resolveActiveHref('/')).toBeNull();
  });

  it('returns null for empty input', () => {
    expect(resolveActiveHref(null)).toBeNull();
    expect(resolveActiveHref(undefined)).toBeNull();
    expect(resolveActiveHref('')).toBeNull();
  });

  it('resolves exactly one active link for every nav destination', () => {
    for (const link of ADMIN_NAV_LINKS) {
      expect(resolveActiveHref(link.href)).toBe(link.href);
    }
  });

  it('accepts a custom link list', () => {
    const links = [{ href: '/admin/a' }, { href: '/admin/a/b' }];
    expect(resolveActiveHref('/admin/a/b/c', links)).toBe('/admin/a/b');
  });
});
