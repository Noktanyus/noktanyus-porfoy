/**
 * Newsletter Service — Unit Tests
 *
 * Test edilenler:
 *   - Module exports & surface
 *   - Subscribe validation
 *   - Verify/unsubscribe token handling
 *   - Stats retrieval
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Prisma mock
vi.mock('@/lib/prisma', () => ({
  prisma: {
    newsletterSubscriber: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
  },
}));

// Email + Logger mock
vi.mock('@/lib/email', () => ({
  sendEmail: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

import { prisma } from '@/lib/prisma';
import { newsletterService } from '../service';

describe('NewsletterService', () => {
  beforeEach(() => {
    // Mock implementations + history sıfırla (clearAllMocks sadece history siler)
    vi.resetAllMocks();
  });

  describe('module surface', () => {
    it('exposes core functions', () => {
      expect(typeof newsletterService.subscribe).toBe('function');
      expect(typeof newsletterService.verify).toBe('function');
      expect(typeof newsletterService.unsubscribe).toBe('function');
      expect(typeof newsletterService.getStats).toBe('function');
      expect(typeof newsletterService.listSubscribers).toBe('function');
    });
  });

  describe('subscribe', () => {
    it('yeni abone oluşturur ve doğrulama email gönderir', async () => {
      vi.mocked(prisma.newsletterSubscriber.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.newsletterSubscriber.create).mockResolvedValue({
        id: 'sub-1',
        email: 'new@example.com',
        name: 'Test',
        categories: [],
        active: true,
        verifiedAt: null,
        verifyToken: 'vtoken',
        unsubscribedAt: null,
        unsubscribeToken: 'utoken',
        source: 'footer',
        ipAddress: null,
        userAgent: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const result = await newsletterService.subscribe({
        email: 'new@example.com',
        name: 'Test',
        source: 'footer',
      });

      expect(result.success).toBe(true);
      expect(result.alreadySubscribed).toBeUndefined();
      expect(prisma.newsletterSubscriber.create).toHaveBeenCalled();
    });

    it('email lower-case normalize edilir', async () => {
      vi.mocked(prisma.newsletterSubscriber.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.newsletterSubscriber.create).mockResolvedValue({} as any);

      await newsletterService.subscribe({
        email: 'USER@EXAMPLE.COM',
        source: 'blog',
      });

      expect(prisma.newsletterSubscriber.findUnique).toHaveBeenCalledWith({
        where: { email: 'user@example.com' },
      });
    });

    it('zaten aktif doğrulanmış abone için alreadySubscribed true döner', async () => {
      vi.mocked(prisma.newsletterSubscriber.findUnique).mockResolvedValue({
        id: 'sub-1',
        email: 'exists@example.com',
        name: null,
        categories: [],
        active: true,
        verifiedAt: new Date(),
        verifyToken: null,
        unsubscribedAt: null,
        unsubscribeToken: 'utoken',
        source: 'footer',
        ipAddress: null,
        userAgent: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const result = await newsletterService.subscribe({
        email: 'exists@example.com',
        source: 'footer',
      });

      expect(result.alreadySubscribed).toBe(true);
      expect(prisma.newsletterSubscriber.create).not.toHaveBeenCalled();
    });

    it('geçersiz email Zod hatası fırlatır', async () => {
      await expect(
        newsletterService.subscribe({
          email: 'not-an-email',
          source: 'footer',
        })
      ).rejects.toThrow();
      expect(prisma.newsletterSubscriber.create).not.toHaveBeenCalled();
    });

    it('çok uzun email Zod hatası fırlatır', async () => {
      await expect(
        newsletterService.subscribe({
          email: 'a'.repeat(210) + '@example.com',
          source: 'footer',
        })
      ).rejects.toThrow();
    });
  });

  describe('verify', () => {
    it('geçerli token için verifiedAt set eder', async () => {
      vi.mocked(prisma.newsletterSubscriber.findUnique).mockResolvedValue({
        id: 'sub-1',
        email: 'user@example.com',
        verifyToken: 'vtoken',
        verifiedAt: null,
        active: false,
        unsubscribedAt: null,
      } as any);

      vi.mocked(prisma.newsletterSubscriber.update).mockResolvedValue({
        id: 'sub-1',
        verifiedAt: new Date(),
      } as any);

      await newsletterService.verify('vtoken');

      expect(prisma.newsletterSubscriber.update).toHaveBeenCalled();
    });

    it('geçersiz token hata fırlatır', async () => {
      vi.mocked(prisma.newsletterSubscriber.findUnique).mockResolvedValue(null);

      await expect(newsletterService.verify('invalid')).rejects.toThrow();
    });
  });

  describe('unsubscribe', () => {
    it('geçerli token için active=false ve unsubscribedAt set eder', async () => {
      vi.mocked(prisma.newsletterSubscriber.findUnique).mockResolvedValue({
        id: 'sub-1',
        email: 'user@example.com',
        unsubscribeToken: 'utoken',
        active: true,
        unsubscribedAt: null,
      } as any);

      vi.mocked(prisma.newsletterSubscriber.update).mockResolvedValue({} as any);

      await newsletterService.unsubscribe('utoken');

      expect(prisma.newsletterSubscriber.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'sub-1' },
          data: expect.objectContaining({
            active: false,
            unsubscribedAt: expect.any(Date),
          }),
        })
      );
    });

    it('geçersiz token hata fırlatır', async () => {
      vi.mocked(prisma.newsletterSubscriber.findUnique).mockResolvedValue(null);

      await expect(newsletterService.unsubscribe('bad-token')).rejects.toThrow();
    });
  });

  describe('getStats', () => {
    it('toplam/aktif/verified istatistiklerini döner', async () => {
      vi.mocked(prisma.newsletterSubscriber.count)
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(80)
        .mockResolvedValueOnce(75);

      const stats = await newsletterService.getStats();

      expect(stats.total).toBe(100);
      expect(stats.active).toBe(80);
      expect(stats.verified).toBe(75);
    });
  });
});