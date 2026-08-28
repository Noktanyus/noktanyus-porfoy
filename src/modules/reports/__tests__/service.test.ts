/**
 * Custom Report Service Unit Tests
 *
 * Phase: G3 Custom Report Builder
 * - Service exports dogru method'lari saglar
 * - runQuery dogru report type'a dispatch eder
 * - execute timing + execution history yazar
 * - delete auth kontrolu yapar
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    customReport: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
    },
    reportExecution: {
      create: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
    },
    order: {
      findMany: vi.fn(),
      aggregate: vi.fn(),
    },
    user: {
      findMany: vi.fn(),
    },
    monitor: {
      findMany: vi.fn(),
    },
  },
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
import { reportService } from '../service';
import { NotFoundError, UnauthorizedError } from '@/modules/shared/errors';

const mockPrisma = prisma as unknown as {
  customReport: {
    findMany: any;
    findUnique: any;
    create: any;
    delete: any;
    update: any;
  };
  reportExecution: {
    create: any;
    update: any;
    findMany: any;
  };
  order: { findMany: any; aggregate: any };
  user: { findMany: any };
  monitor: { findMany: any };
};

describe('reportService — Exports', () => {
  it('exposes core service methods', () => {
    expect(typeof reportService.list).toBe('function');
    expect(typeof reportService.getById).toBe('function');
    expect(typeof reportService.create).toBe('function');
    expect(typeof reportService.execute).toBe('function');
    expect(typeof reportService.runQuery).toBe('function');
    expect(typeof reportService.delete).toBe('function');
    expect(typeof reportService.getExecutions).toBe('function');
  });
});

describe('reportService — list', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('queries reports filtered by createdById', async () => {
    const reports = [{ id: 'r1', name: 'Test' }];
    mockPrisma.customReport.findMany.mockResolvedValueOnce(reports);

    const result = await reportService.list('user_123');

    expect(result).toEqual(reports);
    expect(mockPrisma.customReport.findMany).toHaveBeenCalledWith({
      where: { createdById: 'user_123' },
      orderBy: { createdAt: 'desc' },
    });
  });
});

describe('reportService — create', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a report with defaults applied', async () => {
    const created = { id: 'r1', name: 'Monthly', recipients: [], config: {} };
    mockPrisma.customReport.create.mockResolvedValueOnce(created);

    const result = await reportService.create('user_1', {
      name: 'Monthly',
      reportType: 'revenue',
      config: {},
    });

    expect(result).toEqual(created);
    expect(mockPrisma.customReport.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: 'Monthly',
        reportType: 'revenue',
        recipients: [],
        format: 'table',
        createdById: 'user_1',
      }),
    });
  });

  it('passes through recipients and schedule when provided', async () => {
    mockPrisma.customReport.create.mockResolvedValueOnce({ id: 'r2' });

    await reportService.create('user_2', {
      name: 'Daily',
      reportType: 'orders',
      config: {},
      schedule: 'daily',
      recipients: ['a@b.com'],
      format: 'bar',
    });

    expect(mockPrisma.customReport.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        schedule: 'daily',
        recipients: ['a@b.com'],
        format: 'bar',
      }),
    });
  });
});

describe('reportService — runQuery dispatch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('dispatches orders query', async () => {
    mockPrisma.order.findMany.mockResolvedValueOnce([{ id: 'o1' }]);

    await reportService.runQuery({ reportType: 'orders', config: {} });

    expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: 'PAID' },
        take: 1000,
      })
    );
  });

  it('dispatches users query', async () => {
    mockPrisma.user.findMany.mockResolvedValueOnce([{ id: 'u1' }]);

    await reportService.runQuery({ reportType: 'users', config: {} });

    expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 1000 })
    );
  });

  it('dispatches monitors query', async () => {
    mockPrisma.monitor.findMany.mockResolvedValueOnce([{ id: 'm1' }]);

    await reportService.runQuery({ reportType: 'monitors', config: {} });

    expect(mockPrisma.monitor.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 1000 })
    );
  });

  it('dispatches revenue aggregation', async () => {
    mockPrisma.order.aggregate.mockResolvedValueOnce({
      _sum: { totalCents: 50000 },
      _count: { _all: 10 },
      _avg: { totalCents: 5000 },
    });

    const result = await reportService.runQuery({
      reportType: 'revenue',
      config: {},
    });

    expect(mockPrisma.order.aggregate).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: 'PAID' } })
    );
    expect(result).toEqual(
      expect.objectContaining({
        totalRevenueCents: 50000,
        orderCount: 10,
        averageOrderCents: 5000,
      })
    );
  });

  it('returns empty array for unknown report type', async () => {
    const result = await reportService.runQuery({
      reportType: 'unknown_type',
      config: {},
    });
    expect(result).toEqual([]);
  });
});

describe('reportService — execute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('records execution with timing on success', async () => {
    mockPrisma.customReport.findUnique.mockResolvedValueOnce({
      id: 'r1',
      reportType: 'revenue',
      config: {},
    });
    mockPrisma.reportExecution.create.mockResolvedValueOnce({
      id: 'exec_1',
    });
    mockPrisma.order.aggregate.mockResolvedValueOnce({
      _sum: { totalCents: 1000 },
      _count: { _all: 1 },
      _avg: { totalCents: 1000 },
    });
    mockPrisma.reportExecution.update.mockResolvedValueOnce({});
    mockPrisma.customReport.update.mockResolvedValueOnce({});

    const result = await reportService.execute('r1');

    expect(result.status).toBe('success');
    expect(result.executionId).toBe('exec_1');
    expect(typeof result.durationMs).toBe('number');
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
    expect(mockPrisma.reportExecution.create).toHaveBeenCalledWith({
      data: { reportId: 'r1', status: 'running' },
    });
    expect(mockPrisma.reportExecution.update).toHaveBeenCalledWith({
      where: { id: 'exec_1' },
      data: expect.objectContaining({ status: 'success' }),
    });
    expect(mockPrisma.customReport.update).toHaveBeenCalledWith({
      where: { id: 'r1' },
      data: expect.objectContaining({ lastRunAt: expect.any(Date) }),
    });
  });

  it('throws NotFoundError when report missing', async () => {
    mockPrisma.customReport.findUnique.mockResolvedValueOnce(null);

    await expect(reportService.execute('missing')).rejects.toBeInstanceOf(
      NotFoundError
    );
  });

  it('marks status as failed on query error', async () => {
    mockPrisma.customReport.findUnique.mockResolvedValueOnce({
      id: 'r2',
      reportType: 'orders',
      config: {},
    });
    mockPrisma.reportExecution.create.mockResolvedValueOnce({ id: 'exec_2' });
    mockPrisma.order.findMany.mockRejectedValueOnce(new Error('DB down'));
    mockPrisma.reportExecution.update.mockResolvedValueOnce({});

    const result = await reportService.execute('r2');

    expect(result.status).toBe('failed');
    expect(result.errorMessage).toBe('DB down');
    expect(mockPrisma.reportExecution.update).toHaveBeenCalledWith({
      where: { id: 'exec_2' },
      data: expect.objectContaining({
        status: 'failed',
        errorMessage: 'DB down',
      }),
    });
  });
});

describe('reportService — delete', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws NotFoundError if report does not exist', async () => {
    mockPrisma.customReport.findUnique.mockResolvedValueOnce(null);
    await expect(reportService.delete('missing', 'user_1')).rejects.toBeInstanceOf(
      NotFoundError
    );
  });

  it('throws UnauthorizedError if user is not owner', async () => {
    mockPrisma.customReport.findUnique.mockResolvedValueOnce({
      id: 'r1',
      createdById: 'owner_user',
    });
    await expect(
      reportService.delete('r1', 'different_user')
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('deletes report when user is owner', async () => {
    mockPrisma.customReport.findUnique.mockResolvedValueOnce({
      id: 'r1',
      createdById: 'user_1',
    });
    mockPrisma.customReport.delete.mockResolvedValueOnce({});

    const result = await reportService.delete('r1', 'user_1');

    expect(result).toEqual({ id: 'r1', deleted: true });
    expect(mockPrisma.customReport.delete).toHaveBeenCalledWith({
      where: { id: 'r1' },
    });
  });
});

describe('reportService — getExecutions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns executions ordered by createdAt desc', async () => {
    const executions = [{ id: 'e1' }, { id: 'e2' }];
    mockPrisma.reportExecution.findMany.mockResolvedValueOnce(executions);

    const result = await reportService.getExecutions('r1', 5);

    expect(result).toEqual(executions);
    expect(mockPrisma.reportExecution.findMany).toHaveBeenCalledWith({
      where: { reportId: 'r1' },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
  });
});