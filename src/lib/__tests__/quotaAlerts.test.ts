import { beforeEach, describe, expect, it, vi } from 'vitest';

const { findFirst, dispatch } = vi.hoisted(() => ({
  findFirst: vi.fn(),
  dispatch: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    notification: { findFirst },
  },
}));

vi.mock('@/modules/notifications/service', () => ({
  notificationService: { dispatch },
}));

vi.mock('@/lib/logger', () => ({
  logger: { debug: vi.fn(), warn: vi.fn() },
}));

import { maybeNotifyQuotaThreshold } from '@/lib/quotaAlerts';

describe('maybeNotifyQuotaThreshold', () => {
  beforeEach(() => {
    findFirst.mockReset();
    dispatch.mockReset();
    findFirst.mockResolvedValue(null);
    dispatch.mockResolvedValue({ id: 'n1' });
  });

  it('sends warn at 80%+ subscription usage', async () => {
    await maybeNotifyQuotaThreshold('u1', {
      allowed: true,
      remaining: 15,
      remainingRequests: 15,
      limit: 100,
      limitRequests: 100,
      planSlug: 'pro',
      billingSource: 'subscription',
    });
    expect(dispatch).toHaveBeenCalledWith(
      'u1',
      'quota.warn',
      expect.objectContaining({ link: '/dashboard/usage' })
    );
  });

  it('skips when already notified today', async () => {
    findFirst.mockResolvedValue({ id: 'existing' });
    await maybeNotifyQuotaThreshold('u1', {
      allowed: true,
      remaining: 10,
      remainingRequests: 10,
      limit: 100,
      limitRequests: 100,
      planSlug: 'pro',
      billingSource: 'subscription',
    });
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('ignores credit billing for pct alerts', async () => {
    await maybeNotifyQuotaThreshold('u1', {
      allowed: true,
      remaining: 5,
      remainingRequests: 5,
      limit: 5,
      limitRequests: 5,
      planSlug: null,
      billingSource: 'credits',
    });
    expect(dispatch).not.toHaveBeenCalled();
  });
});
