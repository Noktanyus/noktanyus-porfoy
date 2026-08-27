/**
 * @file monitoringService unit tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    monitor: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    monitorCheck: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    incident: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
    },
    alertChannel: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

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
import { monitoringService } from '../service';

describe('monitoringService', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('exposed API', () => {
    it('core functions are exported', async () => {
      expect(typeof monitoringService.checkMonitor).toBe('function');
      expect(typeof monitoringService.runScheduledChecks).toBe('function');
      expect(typeof monitoringService.listMonitors).toBe('function');
      expect(typeof monitoringService.getStats).toBe('function');
    });
  });

  describe('listMonitors', () => {
    it('returns user monitors', async () => {
      vi.mocked(prisma.monitor.findMany).mockResolvedValue([
        { id: 'm1', userId: 'u1', status: 'UP', uptimePct30d: 100, alertChannelIds: [], tags: [] },
      ] as any);

      const result = await monitoringService.listMonitors('u1');

      expect(prisma.monitor.findMany).toHaveBeenCalledWith({
        where: { userId: 'u1' },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toHaveLength(1);
    });

    it('filters by status when provided', async () => {
      vi.mocked(prisma.monitor.findMany).mockResolvedValue([]);
      await monitoringService.listMonitors('u1', { status: 'DOWN' });
      expect(prisma.monitor.findMany).toHaveBeenCalledWith({
        where: { userId: 'u1', status: 'DOWN' },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('getMonitor', () => {
    it('throws NotFoundError when missing or not owned', async () => {
      vi.mocked(prisma.monitor.findFirst).mockResolvedValue(null);
      await expect(monitoringService.getMonitor('u1', 'mx')).rejects.toThrow();
    });

    it('returns monitor when owned', async () => {
      const monitor = { id: 'm1', userId: 'u1' };
      vi.mocked(prisma.monitor.findFirst).mockResolvedValue(monitor as any);
      const result = await monitoringService.getMonitor('u1', 'm1');
      expect(result).toEqual(monitor);
    });
  });

  describe('getStats', () => {
    it('aggregates counts correctly', async () => {
      vi.mocked(prisma.monitor.findMany).mockResolvedValue([
        { id: '1', status: 'UP', uptimePct30d: 100 },
        { id: '2', status: 'UP', uptimePct30d: 99.5 },
        { id: '3', status: 'DOWN', uptimePct30d: 80 },
        { id: '4', status: 'PAUSED', uptimePct30d: 95 },
        { id: '5', status: 'PENDING', uptimePct30d: 100 },
      ] as any);

      const stats = await monitoringService.getStats('u1');
      expect(stats).toEqual({
        total: 5,
        up: 2,
        down: 1,
        paused: 1,
        pending: 1,
        avgUptime: 94.9,
      });
    });

    it('returns 100% when no monitors', async () => {
      vi.mocked(prisma.monitor.findMany).mockResolvedValue([]);
      const stats = await monitoringService.getStats('u1');
      expect(stats).toEqual({
        total: 0,
        up: 0,
        down: 0,
        paused: 0,
        pending: 0,
        avgUptime: 100,
      });
    });
  });

  describe('createMonitor', () => {
    it('validates unique publicSlug', async () => {
      vi.mocked(prisma.monitor.findUnique).mockResolvedValue({ id: 'other' } as any);
      await expect(
        monitoringService.createMonitor('u1', {
          name: 'Test',
          url: 'https://example.com',
          type: 'HTTPS',
          intervalSec: 300,
          timeoutSec: 30,
          isPublic: true,
          publicSlug: 'taken-slug',
          region: 'auto',
          tags: [],
          alertChannelIds: [],
        })
      ).rejects.toThrow();
    });

    it('creates monitor with PENDING status', async () => {
      vi.mocked(prisma.monitor.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.monitor.create).mockResolvedValue({ id: 'm1' } as any);
      await monitoringService.createMonitor('u1', {
        name: 'Test',
        url: 'https://example.com',
        type: 'HTTPS',
        intervalSec: 300,
        timeoutSec: 30,
        isPublic: false,
        region: 'auto',
        tags: [],
        alertChannelIds: [],
      });
      expect(prisma.monitor.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'PENDING',
            uptimePct30d: 100,
            userId: 'u1',
          }),
        })
      );
    });
  });

  describe('runScheduledChecks', () => {
    it('returns counts from scheduled run', async () => {
      vi.mocked(prisma.monitor.findMany).mockResolvedValue([]);
      const result = await monitoringService.runScheduledChecks();
      expect(result).toEqual({ successCount: 0, failCount: 0, total: 0 });
    });
  });

  describe('formatAlertMessage', () => {
    it('formats down event', () => {
      const msg = monitoringService.formatAlertMessage(
        'down',
        { name: 'API', url: 'https://api.com' },
        { reason: 'Timeout' }
      );
      expect(msg).toContain('DOWN');
      expect(msg).toContain('Timeout');
    });

    it('formats up event with duration', () => {
      const msg = monitoringService.formatAlertMessage(
        'up',
        { name: 'API', url: 'https://api.com' },
        { durationSec: 120 }
      );
      expect(msg).toContain('UP');
      expect(msg).toContain('120s');
    });
  });

  describe('validateChannelConfig', () => {
    it('EMAIL: requires email', () => {
      expect(() => monitoringService.validateChannelConfig('EMAIL', {})).toThrow();
      expect(() => monitoringService.validateChannelConfig('EMAIL', { email: 'a@b.com' })).not.toThrow();
    });

    it('WEBHOOK: requires valid url', () => {
      expect(() => monitoringService.validateChannelConfig('WEBHOOK', {})).toThrow();
      expect(() => monitoringService.validateChannelConfig('WEBHOOK', { webhookUrl: 'not-url' })).toThrow();
      expect(() => monitoringService.validateChannelConfig('WEBHOOK', { webhookUrl: 'https://x.com' })).not.toThrow();
    });

    it('TELEGRAM: requires botToken and chatId', () => {
      expect(() => monitoringService.validateChannelConfig('TELEGRAM', { botToken: 'x' })).toThrow();
      expect(() =>
        monitoringService.validateChannelConfig('TELEGRAM', { botToken: 'x', chatId: 'y' })
      ).not.toThrow();
    });
  });
});
