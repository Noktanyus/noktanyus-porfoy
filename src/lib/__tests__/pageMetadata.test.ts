/**
 * @file pageMetadata (safeMetadata + staticMetadata) unit testleri.
 * @description DB fetch wrapper'ı ve statik metadata üreticisinin doğru
 *              davrandığını doğrular. Build-time hata senaryoları kritik.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Logger'ı mockla — test ortamında Sentry yok
vi.mock('../logger', () => ({
  logger: {
    warn: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

import { safeMetadata, staticMetadata } from '../pageMetadata';

describe('pageMetadata', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, NODE_ENV: 'test' };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  describe('safeMetadata', () => {
    it('returns result when fn resolves with metadata', async () => {
      const result = await safeMetadata(
        async () => ({ title: 'Real Title', description: 'Real desc' }),
        { title: 'Fallback', description: 'Fallback desc' }
      );
      expect(result.title).toBe('Real Title');
      expect(result.description).toBe('Real desc');
    });

    it('returns fallback when fn returns null', async () => {
      const result = await safeMetadata(
        async () => null,
        { title: 'Fallback Title', description: 'Fallback desc', path: '/x' }
      );
      expect(result.title).toBe('Fallback Title');
      expect(result.description).toBe('Fallback desc');
      expect(result.alternates?.canonical).toContain('/x');
    });

    it('returns fallback when fn returns undefined', async () => {
      const result = await safeMetadata(
        async () => undefined,
        { title: 'Fb' }
      );
      expect(result.title).toBe('Fb');
    });

    it('returns fallback when fn throws (Prisma error simulation)', async () => {
      const result = await safeMetadata(
        async () => {
          throw new Error('Prisma client initialization failed');
        },
        { title: 'Build Fallback', description: 'Build-time safe metadata', path: '/blog/foo' }
      );
      expect(result.title).toBe('Build Fallback');
      expect(result.description).toBe('Build-time safe metadata');
      expect(result.alternates?.canonical).toContain('/blog/foo');
    });

    it('includes OG + Twitter + canonical in fallback', async () => {
      const result = await safeMetadata(
        async () => { throw new Error('DB unreachable'); },
        { title: 'T', description: 'D', path: '/magaza/x', image: '/img.png' }
      );
      expect((result.openGraph as any)?.title).toBe('T');
      expect((result.openGraph as any)?.description).toBe('D');
      expect((result.openGraph as any)?.type).toBe('website');
      expect((result.openGraph as any)?.locale).toBe('tr_TR');
      expect((result.openGraph as any)?.siteName).toBe('Noktanyus');
      expect(result.twitter).toMatchObject({
        card: 'summary_large_image',
        title: 'T',
        description: 'D',
      });
      expect(result.robots).toEqual({ index: true, follow: true });
    });

    it('does not include canonical when path is missing', async () => {
      const result = await safeMetadata(
        async () => null,
        { title: 'T' }
      );
      expect(result.alternates).toBeUndefined();
    });

    it('description defaults to title when not provided', async () => {
      const result = await safeMetadata(
        async () => { throw new Error(); },
        { title: 'JustTitle' }
      );
      expect(result.description).toBe('JustTitle');
      expect(result.openGraph?.description).toBe('JustTitle');
    });
  });

  describe('staticMetadata', () => {
    it('generates complete Metadata object', () => {
      const m = staticMetadata({
        title: 'Static',
        description: 'Desc',
        path: '/foo',
        type: 'article',
      });
      expect(m.title).toBe('Static');
      expect(m.description).toBe('Desc');
      expect((m.openGraph as any)?.type).toBe('article');
      expect(m.alternates?.canonical).toContain('/foo');
    });

    it('defaults type to website', () => {
      const m = staticMetadata({ title: 'X' });
      expect((m.openGraph as any)?.type).toBe('website');
    });
  });
});
