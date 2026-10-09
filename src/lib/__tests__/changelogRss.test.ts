import { describe, expect, it } from 'vitest';
import { buildChangelogRssXml } from '@/lib/changelogRss';

describe('buildChangelogRssXml', () => {
  it('geçerli RSS 2.0 üretir', () => {
    const xml = buildChangelogRssXml();
    expect(xml).toContain('<?xml version="1.0"');
    expect(xml).toContain('<rss version="2.0">');
    expect(xml).toContain('Noktanyus Changelog');
    expect(xml).toContain('<item>');
    expect(xml).toContain('2026-10-09-saas-console');
  });
});
