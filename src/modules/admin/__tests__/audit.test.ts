/**
 * @file AuditRepository + auditService unit tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => {
  const auditLog = {
    create: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    count: vi.fn(),
    groupBy: vi.fn(),
  };
  return { prisma: { auditLog } };
});

import { prisma } from '@/lib/prisma';
import { auditRepository, auditService } from '../audit';

describe('AuditRepository', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('create', () => {
    it('prisma.auditLog.create çağırır', async () => {
      vi.mocked(prisma.auditLog.create).mockResolvedValue({ id: 'a1' } as any);
      await auditRepository.create({ action: 'CREATE', resource: 'Blog' } as any);
      expect(prisma.auditLog.create).toHaveBeenCalled();
    });
  });

  describe('findRecent', () => {
    it('default 50 limit', async () => {
      vi.mocked(prisma.auditLog.findMany).mockResolvedValue([]);
      await auditRepository.findRecent();
      expect(prisma.auditLog.findMany).toHaveBeenCalledWith({
        orderBy: { timestamp: 'desc' },
        take: 50,
      });
    });
  });

  describe('findByResource', () => {
    it('resourceId yoksa sadece resource filtresi', async () => {
      vi.mocked(prisma.auditLog.findMany).mockResolvedValue([]);
      await auditRepository.findByResource('Blog');
      expect(prisma.auditLog.findMany).toHaveBeenCalledWith({
        where: { resource: 'Blog' },
        orderBy: { timestamp: 'desc' },
      });
    });

    it('resourceId varsa ekler', async () => {
      vi.mocked(prisma.auditLog.findMany).mockResolvedValue([]);
      await auditRepository.findByResource('Blog', 'b1');
      expect(prisma.auditLog.findMany).toHaveBeenCalledWith({
        where: { resource: 'Blog', resourceId: 'b1' },
        orderBy: { timestamp: 'desc' },
      });
    });
  });

  describe('findFiltered', () => {
    it('tüm filtreleri doğru iletir', async () => {
      vi.mocked(prisma.auditLog.findMany).mockResolvedValue([]);
      await auditRepository.findFiltered({
        action: 'CREATE',
        resource: 'Blog',
        userId: 'u1',
        status: 'success',
        skip: 10,
        take: 25,
      });
      expect(prisma.auditLog.findMany).toHaveBeenCalledWith({
        where: {
          action: 'CREATE',
          resource: 'Blog',
          userId: 'u1',
          status: 'success',
        },
        orderBy: { timestamp: 'desc' },
        skip: 10,
        take: 25,
      });
    });

    it('boş filtreler WHERE eklemez', async () => {
      vi.mocked(prisma.auditLog.findMany).mockResolvedValue([]);
      await auditRepository.findFiltered({});
      expect(prisma.auditLog.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { timestamp: 'desc' },
        skip: 0,
        take: 50,
      });
    });
  });

  describe('getStats', () => {
    it('toplam, bugün, byAction ve failure sayısını döner', async () => {
      vi.mocked(prisma.auditLog.count)
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(5) // today
        .mockResolvedValueOnce(2); // failures
      vi.mocked(prisma.auditLog.groupBy).mockResolvedValue([
        { action: 'CREATE', _count: 50 },
        { action: 'UPDATE', _count: 30 },
      ] as any);

      const stats = await auditRepository.getStats();

      expect(stats.total).toBe(100);
      expect(stats.today).toBe(5);
      expect(stats.failures).toBe(2);
      expect(stats.byAction).toEqual([
        { action: 'CREATE', count: 50 },
        { action: 'UPDATE', count: 30 },
      ]);
      expect(prisma.auditLog.count).toHaveBeenCalledTimes(3);
    });
  });
});

describe('auditService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('listRecent', async () => {
    vi.mocked(prisma.auditLog.findMany).mockResolvedValue([]);
    await auditService.listRecent();
    expect(prisma.auditLog.findMany).toHaveBeenCalled();
  });

  it('listByResource', async () => {
    vi.mocked(prisma.auditLog.findMany).mockResolvedValue([]);
    await auditService.listByResource('Blog', 'b1');
    expect(prisma.auditLog.findMany).toHaveBeenCalledWith({
      where: { resource: 'Blog', resourceId: 'b1' },
      orderBy: { timestamp: 'desc' },
    });
  });

  it('getStats', async () => {
    vi.mocked(prisma.auditLog.count).mockResolvedValue(0);
    vi.mocked(prisma.auditLog.groupBy).mockResolvedValue([]);
    const stats = await auditService.getStats();
    expect(stats).toBeDefined();
  });

  describe('paginate', () => {
    it('doğru skip/take hesaplar ve total döner', async () => {
      vi.mocked(prisma.auditLog.findMany).mockResolvedValue([]);
      vi.mocked(prisma.auditLog.count).mockResolvedValue(120);

      const result = await auditService.paginate({ page: 3, pageSize: 25 });

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 50, take: 25 })
      );
      expect(result.total).toBe(120);
      expect(result.page).toBe(3);
      expect(result.pageSize).toBe(25);
      expect(result.totalPages).toBe(5);
    });

    it('geçersiz page 1\'e normalize edilir', async () => {
      vi.mocked(prisma.auditLog.findMany).mockResolvedValue([]);
      vi.mocked(prisma.auditLog.count).mockResolvedValue(0);

      const result = await auditService.paginate({ page: -5 as any });
      expect(result.page).toBe(1);
    });

    it('pageSize 200\'den büyükse 200\'e kırpılır', async () => {
      vi.mocked(prisma.auditLog.findMany).mockResolvedValue([]);
      vi.mocked(prisma.auditLog.count).mockResolvedValue(0);

      const result = await auditService.paginate({ pageSize: 10000 });
      expect(result.pageSize).toBe(200);
    });
  });
});
