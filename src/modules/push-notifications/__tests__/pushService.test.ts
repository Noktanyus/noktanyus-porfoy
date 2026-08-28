/**
 * PushService Unit Tests
 *
 * web-push SDK ve prisma mock'lanir. Servisin disable davranisi,
 * subscribe/unsubscribe ve broadcast akisindaki temel senaryolar test edilir.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// web-push mock
vi.mock('web-push', () => ({
  default: {
    setVapidDetails: vi.fn(),
    sendNotification: vi.fn(),
  },
}));

// prisma mock
vi.mock('@/lib/prisma', () => ({
  prisma: {
    pushSubscription: {
      upsert: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      updateMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

import webpush from 'web-push';
import { prisma } from '@/lib/prisma';
import { pushService } from '../pushService';

const mockedWebpush = webpush as unknown as {
  setVapidDetails: ReturnType<typeof vi.fn>;
  sendNotification: ReturnType<typeof vi.fn>;
};

const mockedPrisma = prisma as unknown as {
  pushSubscription: {
    upsert: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
    updateMany: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
  };
};

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  // Sadece VAPID ile ilgili anahtarlari geri yukle. Diger env (DB vs) korunur.
  delete process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  delete process.env.VAPID_PRIVATE_KEY;
  delete process.env.VAPID_SUBJECT;
  if (ORIGINAL_ENV.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = ORIGINAL_ENV.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  }
  if (ORIGINAL_ENV.VAPID_PRIVATE_KEY) {
    process.env.VAPID_PRIVATE_KEY = ORIGINAL_ENV.VAPID_PRIVATE_KEY;
  }
  if (ORIGINAL_ENV.VAPID_SUBJECT) {
    process.env.VAPID_SUBJECT = ORIGINAL_ENV.VAPID_SUBJECT;
  }
  // Mock fonksiyonlarinin implementasyonlarini sifirla
  mockedWebpush.sendNotification.mockReset();
  mockedWebpush.setVapidDetails.mockReset();
  mockedPrisma.pushSubscription.upsert.mockReset();
  mockedPrisma.pushSubscription.findMany.mockReset();
  mockedPrisma.pushSubscription.updateMany.mockReset();
  mockedPrisma.pushSubscription.findUnique.mockReset();
});

describe('pushService', () => {
  it('isEnabled() reflects env presence', () => {
    expect(pushService.isEnabled()).toBe(false);
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = 'PUB';
    process.env.VAPID_PRIVATE_KEY = 'PRIV';
    expect(pushService.isEnabled()).toBe(true);
  });

  it('subscribe() upserts subscription via repository', async () => {
    const subMock = {
      id: 'sub1',
      userId: 'u1',
      endpoint: 'https://push.example.com/123',
      p256dh: 'p2',
      auth: 'a2',
      active: true,
      createdAt: new Date(),
    };
    mockedPrisma.pushSubscription.upsert.mockResolvedValueOnce(subMock);

    const result = await pushService.subscribe('u1', {
      endpoint: 'https://push.example.com/123',
      p256dh: 'p2',
      auth: 'a2',
    });

    expect(mockedPrisma.pushSubscription.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { endpoint: 'https://push.example.com/123' },
        create: expect.objectContaining({ userId: 'u1', active: true }),
        update: expect.objectContaining({ userId: 'u1', active: true }),
      })
    );
    expect(result.id).toBe('sub1');
  });

  it('unsubscribe() soft-deletes by endpoint', async () => {
    mockedPrisma.pushSubscription.updateMany.mockResolvedValueOnce({ count: 1 });
    const result = await pushService.unsubscribe('https://push.example.com/123');

    expect(mockedPrisma.pushSubscription.updateMany).toHaveBeenCalledWith({
      where: { endpoint: 'https://push.example.com/123', active: true },
      data: { active: false },
    });
    expect(result.count).toBe(1);
  });

  it('sendToUser() returns 0/0 when VAPID keys missing (disabled)', async () => {
    mockedPrisma.pushSubscription.findMany.mockResolvedValueOnce([]);
    const result = await pushService.sendToUser('u1', { title: 't', body: 'b' });
    expect(result).toEqual({ sent: 0, failed: 0 });
    expect(mockedWebpush.sendNotification).not.toHaveBeenCalled();
  });

  it('sendToUser() auto-deactivates on 410 Gone', async () => {
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = 'PUB_KEY';
    process.env.VAPID_PRIVATE_KEY = 'PRIV_KEY';
    process.env.VAPID_SUBJECT = 'mailto:test@example.com';

    mockedWebpush.setVapidDetails.mockReturnValueOnce(undefined);
    mockedPrisma.pushSubscription.findMany.mockResolvedValueOnce([
      {
        id: 's1',
        userId: 'u1',
        endpoint: 'https://push.example.com/dead',
        p256dh: 'p',
        auth: 'a',
        active: true,
        createdAt: new Date(),
      },
    ]);

    const err = new Error('Gone') as Error & { statusCode: number };
    err.statusCode = 410;
    mockedWebpush.sendNotification.mockRejectedValueOnce(err);
    mockedPrisma.pushSubscription.updateMany.mockResolvedValueOnce({ count: 1 });

    const result = await pushService.sendToUser('u1', { title: 't', body: 'b' });

    expect(result.failed).toBe(1);
    expect(result.sent).toBe(0);
    expect(mockedPrisma.pushSubscription.updateMany).toHaveBeenCalledWith({
      where: { endpoint: 'https://push.example.com/dead', active: true },
      data: { active: false },
    });
  });

  it('sendBroadcast() returns success counts for all subscribers', async () => {
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = 'PUB_KEY';
    process.env.VAPID_PRIVATE_KEY = 'PRIV_KEY';
    mockedWebpush.setVapidDetails.mockReturnValueOnce(undefined);
    mockedPrisma.pushSubscription.findMany.mockResolvedValueOnce([
      { id: 's1', userId: 'u1', endpoint: 'e1', p256dh: 'p', auth: 'a', active: true, createdAt: new Date() },
      { id: 's2', userId: 'u2', endpoint: 'e2', p256dh: 'p', auth: 'a', active: true, createdAt: new Date() },
    ]);
    mockedWebpush.sendNotification.mockResolvedValueOnce({});
    mockedWebpush.sendNotification.mockResolvedValueOnce({});

    const result = await pushService.sendBroadcast({ title: 't', body: 'b' });

    expect(result.sent).toBe(2);
    expect(result.failed).toBe(0);
    expect(mockedWebpush.sendNotification).toHaveBeenCalledTimes(2);
  });
});