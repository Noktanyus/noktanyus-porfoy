/**
 * NotificationService Tests
 */

import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    notification: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      createMany: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

describe('NotificationService', () => {
  it('exports core functions', async () => {
    const { notificationService } = await import('../service');
    expect(typeof notificationService.dispatch).toBe('function');
    expect(typeof notificationService.markRead).toBe('function');
    expect(typeof notificationService.markAllRead).toBe('function');
    expect(typeof notificationService.list).toBe('function');
    expect(typeof notificationService.unreadCount).toBe('function');
    expect(typeof notificationService.create).toBe('function');
  });

  it('dispatch skips when userId is missing', async () => {
    const { notificationService } = await import('../service');
    const result = await notificationService.dispatch(null, 'test.event', {
      title: 't',
      message: 'm',
    });
    expect(result).toBeNull();
  });
});
