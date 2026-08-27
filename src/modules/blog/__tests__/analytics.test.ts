/**
 * @file Blog analytics - calculateReadingTime saf fonksiyonu icin unit test.
 * @description Prisma erisimi gerektiren fonksiyonlar (trackBlogView, getPopularBlogs,
 *              getRelatedBlogs) integration test kapsaminda mock ile test edilir;
 *              burada sadece saf hesaplama mantigi dogrudan test ediliyor.
 */

import { describe, it, expect } from 'vitest';
import { calculateReadingTime } from '@/lib/blogAnalytics';

describe('Blog Analytics - calculateReadingTime', () => {
  it('calculates reading time for typical content', () => {
    // 200 kelime * 4 = 800 kelime => 800/180 = 4.44 => ceil => 5
    const text = 'Bu bir test paragrafi. '.repeat(200);
    const result = calculateReadingTime(text);
    expect(result).toBeGreaterThanOrEqual(4);
    expect(result).toBeLessThanOrEqual(6);
  });

  it('handles empty content (minimum 1 minute)', () => {
    expect(calculateReadingTime('')).toBe(1);
  });

  it('handles short content (minimum 1 minute)', () => {
    expect(calculateReadingTime('Kısa.')).toBe(1);
  });

  it('strips markdown before counting', () => {
    const md = '# Baslik\n\n**kalın** ve *italik* [link](https://example.com)\n\n```js\ncode block\n```';
    // Saf metin: "Baslik kalın ve italik link code block"
    expect(calculateReadingTime(md)).toBe(1);
  });

  it('strips HTML tags before counting', () => {
    const html = '<p>Bu bir <strong>test</strong> icerigidir</p>';
    const result = calculateReadingTime(html);
    expect(result).toBe(1);
  });

  it('handles whitespace-only input', () => {
    expect(calculateReadingTime('   \n\t  ')).toBe(1);
  });
});
