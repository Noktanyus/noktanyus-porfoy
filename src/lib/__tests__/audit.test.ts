/**
 * @file Audit logger unit tests
 * @description `logAudit`, `logAuditFailure` ve getter fonksiyonlarının testleri.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Prisma'yı mockla — gerçek DB'ye dokunmamak için
// Hem relative hem alias path'i mockla ki modül ayrı ayrı yüklenmesin
vi.mock('../prisma', () => ({
  prisma: {
    auditLog: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    auditLog: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

// Logger'ı mockla — testlerde Sentry'ye gitmesin
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

import { prisma } from '@/lib/prisma';
import {
  logAudit,
  logAuditFailure,
  getRecentAuditLogs,
  getAuditLogsByResource,
} from '../audit';

describe('Audit Logger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('logAudit', () => {
    it('başarılı kayıt oluşturur', async () => {
      const createMock = vi.mocked(prisma.auditLog.create);
      createMock.mockResolvedValue({
        id: 'audit-1',
        userId: null,
        userEmail: 'admin@example.com',
        action: 'CREATE',
        resource: 'Blog',
        resourceId: 'b1',
        details: null,
        ipAddress: '127.0.0.1',
        userAgent: 'jest',
        status: 'success',
        errorMessage: null,
        timestamp: new Date(),
      } as any);

      await logAudit({
        action: 'CREATE',
        resource: 'Blog',
        userEmail: 'admin@example.com',
        resourceId: 'b1',
        ipAddress: '127.0.0.1',
        userAgent: 'jest',
      });

      expect(createMock).toHaveBeenCalledTimes(1);
      expect(createMock).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'CREATE',
            resource: 'Blog',
            userEmail: 'admin@example.com',
            resourceId: 'b1',
            status: 'success',
          }),
        })
      );
    });

    it('details alanı opsiyonel — yoksa null gider', async () => {
      await logAudit({
        action: 'UPDATE',
        resource: 'Project',
        userEmail: 'a@b.com',
      });

      const call = vi.mocked(prisma.auditLog.create).mock.calls[0][0];
      expect(call.data.details).toBeDefined();
    });

    it('details alanı varsa JSON olarak kaydedilir', async () => {
      await logAudit({
        action: 'CREATE',
        resource: 'Blog',
        details: { slug: 'hello', tags: ['a', 'b'] },
      });

      const call = vi.mocked(prisma.auditLog.create).mock.calls[0][0];
      expect(call.data.details).toEqual({ slug: 'hello', tags: ['a', 'b'] });
    });

    it('DB hata fırlatırsa loglar ama propagate etmez', async () => {
      const createMock = vi.mocked(prisma.auditLog.create);
      createMock.mockRejectedValue(new Error('DB down'));

      // Fonksiyon resolve etmeli, reject etmemeli
      await expect(
        logAudit({ action: 'CREATE', resource: 'X' })
      ).resolves.toBeUndefined();
    });
  });

  describe('logAuditFailure', () => {
    it('failure kaydı oluşturur ve error mesajını kaydeder', async () => {
      const createMock = vi.mocked(prisma.auditLog.create);
      await logAuditFailure(
        {
          action: 'UPDATE',
          resource: 'Project',
          resourceId: 'p1',
          userEmail: 'admin@example.com',
        },
        new Error('Permission denied')
      );

      expect(createMock).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'UPDATE',
            resource: 'Project',
            resourceId: 'p1',
            status: 'failure',
            errorMessage: 'Permission denied',
          }),
        })
      );
    });

    it('non-Error objesini kabul eder (string vs)', async () => {
      const createMock = vi.mocked(prisma.auditLog.create);
      await logAuditFailure(
        { action: 'DELETE', resource: 'Blog' },
        'Something went wrong'
      );

      const call = createMock.mock.calls[0][0];
      expect(call.data.errorMessage).toBe('Something went wrong');
    });

    it('DB hatasında throw etmez', async () => {
      const createMock = vi.mocked(prisma.auditLog.create);
      createMock.mockRejectedValue(new Error('DB'));

      await expect(
        logAuditFailure({ action: 'DELETE', resource: 'X' }, new Error('inner'))
      ).resolves.toBeUndefined();
    });
  });

  describe('getRecentAuditLogs', () => {
    it('varsayılan limit 50 ve desc sıralama ile findMany çağırır', async () => {
      vi.mocked(prisma.auditLog.findMany).mockResolvedValue([]);

      await getRecentAuditLogs();

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith({
        orderBy: { timestamp: 'desc' },
        take: 50,
      });
    });

    it('özel limit değerini uygular', async () => {
      vi.mocked(prisma.auditLog.findMany).mockResolvedValue([]);

      await getRecentAuditLogs(10);

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 10 })
      );
    });
  });

  describe('getAuditLogsByResource', () => {
    it('resourceId yoksa sadece resource filtresi uygular', async () => {
      vi.mocked(prisma.auditLog.findMany).mockResolvedValue([]);

      await getAuditLogsByResource('Blog');

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith({
        where: { resource: 'Blog' },
        orderBy: { timestamp: 'desc' },
        take: 100,
      });
    });

    it('resourceId varsa where koşuluna ekler', async () => {
      vi.mocked(prisma.auditLog.findMany).mockResolvedValue([]);

      await getAuditLogsByResource('Blog', 'b1');

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith({
        where: { resource: 'Blog', resourceId: 'b1' },
        orderBy: { timestamp: 'desc' },
        take: 100,
      });
    });
  });
});
