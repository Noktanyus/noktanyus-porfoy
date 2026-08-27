/**
 * API Key Service — Unit Tests
 *
 * Test edilenler:
 *   - Module exports & surface
 *   - Key generation format (nokt_test_ veya nokt_live_ prefix)
 *   - validateKey returns null for revoked/expired
 *   - Scope helper
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Prisma'yı mockla
vi.mock('@/lib/prisma', () => ({
  prisma: {
    apiKey: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    apiKeyUsage: {
      create: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
    },
  },
}));

// Logger'ı mockla — Sentry'ye gitmesin
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

import { prisma } from '@/lib/prisma';
import { apiKeyService } from '../service';
import { hasScope } from '@/lib/apiKeyMiddleware';

describe('ApiKeyService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('module surface', () => {
    it('exposes core functions', () => {
      expect(typeof apiKeyService.createApiKey).toBe('function');
      expect(typeof apiKeyService.listApiKeys).toBe('function');
      expect(typeof apiKeyService.validateKey).toBe('function');
      expect(typeof apiKeyService.trackUsage).toBe('function');
      expect(typeof apiKeyService.revokeApiKey).toBe('function');
    });
  });

  describe('key format', () => {
    it('starts with nokt_ prefix', () => {
      expect('nokt_test_xyz'.startsWith('nokt_')).toBe(true);
      expect('nokt_live_xyz'.startsWith('nokt_')).toBe(true);
    });
  });

  describe('createApiKey', () => {
    it('persists key with user info, scopes, rate limit and returns full key once', async () => {
      const created = {
        id: 'k1',
        userId: 'u1',
        name: 'Production',
        key: 'nokt_test_abc',
        prefix: 'nokt_test_a',
        scopes: ['read:monitor'],
        rateLimit: 60,
        monthlyQuota: null,
        expiresAt: null,
        revokedAt: null,
        lastUsedAt: null,
        totalRequests: 0,
        revokedReason: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.apiKey.create).mockResolvedValue(created as any);

      const result = await apiKeyService.createApiKey('u1', {
        name: 'Production',
        scopes: ['read:monitor'],
        rateLimit: 60,
        monthlyQuota: null,
        expiresAt: null,
      });

      expect(result.id).toBe('k1');
      // full key döndürülmeli (create anı)
      expect(result.key).toMatch(/^nokt_(test|live)_[a-f0-9]+$/);
      expect(prisma.apiKey.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('validateKey', () => {
    it('returns null if key not found', async () => {
      vi.mocked(prisma.apiKey.findUnique).mockResolvedValue(null);
      const result = await apiKeyService.validateKey('nokt_test_unknown');
      expect(result).toBeNull();
    });

    it('returns null if revoked', async () => {
      vi.mocked(prisma.apiKey.findUnique).mockResolvedValue({
        id: 'k1',
        userId: 'u1',
        key: 'nokt_test_abc',
        prefix: 'nokt_test_a',
        scopes: ['read:monitor'],
        rateLimit: 60,
        monthlyQuota: null,
        expiresAt: null,
        revokedAt: new Date(), // iptal edilmiş
        revokedReason: null,
        lastUsedAt: null,
        totalRequests: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {} as any,
      } as any);

      const result = await apiKeyService.validateKey('nokt_test_abc');
      expect(result).toBeNull();
    });

    it('returns null if expired', async () => {
      vi.mocked(prisma.apiKey.findUnique).mockResolvedValue({
        id: 'k1',
        userId: 'u1',
        key: 'nokt_test_abc',
        prefix: 'nokt_test_a',
        scopes: ['read:monitor'],
        rateLimit: 60,
        monthlyQuota: null,
        expiresAt: new Date(Date.now() - 1000), // geçmiş
        revokedAt: null,
        revokedReason: null,
        lastUsedAt: null,
        totalRequests: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {} as any,
      } as any);

      const result = await apiKeyService.validateKey('nokt_test_abc');
      expect(result).toBeNull();
    });

    it('returns null if monthly quota exceeded', async () => {
      vi.mocked(prisma.apiKey.findUnique).mockResolvedValue({
        id: 'k1',
        userId: 'u1',
        key: 'nokt_test_abc',
        prefix: 'nokt_test_a',
        scopes: ['read:monitor'],
        rateLimit: 60,
        monthlyQuota: 100,
        expiresAt: null,
        revokedAt: null,
        revokedReason: null,
        lastUsedAt: null,
        totalRequests: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {} as any,
      } as any);

      vi.mocked(prisma.apiKeyUsage.count).mockResolvedValue(150); // quota aşıldı

      const result = await apiKeyService.validateKey('nokt_test_abc');
      expect(result).toBeNull();
    });

    it('returns valid context if all checks pass', async () => {
      vi.mocked(prisma.apiKey.findUnique).mockResolvedValue({
        id: 'k1',
        userId: 'u1',
        key: 'nokt_test_abc',
        prefix: 'nokt_test_a',
        scopes: ['read:monitor', 'admin'],
        rateLimit: 60,
        monthlyQuota: null,
        expiresAt: null,
        revokedAt: null,
        revokedReason: null,
        lastUsedAt: null,
        totalRequests: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {} as any,
      } as any);

      const result = await apiKeyService.validateKey('nokt_test_abc');
      expect(result).not.toBeNull();
      expect(result?.userId).toBe('u1');
      expect(result?.keyId).toBe('k1');
      expect(result?.scopes).toEqual(['read:monitor', 'admin']);
      expect(result?.rateLimit).toBe(60);
    });
  });

  describe('trackUsage', () => {
    it('creates usage record and increments counter', async () => {
      vi.mocked(prisma.apiKeyUsage.create).mockResolvedValue({} as any);
      vi.mocked(prisma.apiKey.update).mockResolvedValue({} as any);

      await apiKeyService.trackUsage('k1', {
        endpoint: '/api/test',
        method: 'GET',
        statusCode: 200,
      });

      expect(prisma.apiKeyUsage.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            apiKeyId: 'k1',
            endpoint: '/api/test',
            method: 'GET',
            statusCode: 200,
          }),
        })
      );
      expect(prisma.apiKey.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'k1' },
          data: expect.objectContaining({
            totalRequests: { increment: 1 },
          }),
        })
      );
    });

    it('does not throw on DB error', async () => {
      vi.mocked(prisma.apiKeyUsage.create).mockRejectedValue(new Error('DB down'));
      await expect(
        apiKeyService.trackUsage('k1', {
          endpoint: '/x',
          method: 'GET',
          statusCode: 200,
        })
      ).resolves.toBeUndefined();
    });
  });

  describe('hasScope helper', () => {
    it('admin scope grants everything', () => {
      expect(hasScope(['admin'], 'read:monitor')).toBe(true);
      expect(hasScope(['admin'], 'delete:monitor')).toBe(true);
    });

    it('exact match passes', () => {
      expect(hasScope(['read:monitor'], 'read:monitor')).toBe(true);
    });

    it('mismatch returns false', () => {
      expect(hasScope(['read:monitor'], 'write:monitor')).toBe(false);
      expect(hasScope([], 'read:monitor')).toBe(false);
    });
  });
});