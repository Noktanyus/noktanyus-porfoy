/**
 * Newsletter Broadcast — Unit Tests
 *
 * sendBroadcast fonksiyonunun davranışını doğrular:
 *   - Tüm doğrulanmış + aktif abonelere email gönderir
 *   - Her başarılı gönderimde sent++ yapar
 *   - Başarısız gönderimlerde failed++ yapar ve loglar
 *   - Toplam subscriber sayısını döner
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Prisma mock
vi.mock('@/lib/prisma', () => ({
  prisma: {
    newsletterSubscriber: {
      findMany: vi.fn(),
    },
  },
}));

// Email + Logger mock
vi.mock('@/lib/email', () => ({
  sendEmail: vi.fn().mockResolvedValue({ success: true, messageId: 'mock-1' }),
}));

// Queue mock — enqueueBroadcast job üretimini doğrulamak için
vi.mock('@/lib/queueService', () => ({
  queueService: { sendEmail: vi.fn().mockResolvedValue(undefined), driver: 'memory' },
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
import { sendEmail } from '@/lib/email';
import { newsletterService } from '../service';
import { queueService } from '@/lib/queueService';

const mockSubscribers = [
  {
    id: '1',
    email: 'a@b.com',
    name: 'Alice',
    verifiedAt: new Date(),
    active: true,
    unsubscribedAt: null,
  },
  {
    id: '2',
    email: 'b@b.com',
    name: 'Bob',
    verifiedAt: new Date(),
    active: true,
    unsubscribedAt: null,
  },
  {
    id: '3',
    email: 'c@b.com',
    name: 'Carol',
    verifiedAt: new Date(),
    active: true,
    unsubscribedAt: null,
  },
];

describe('NewsletterService.sendBroadcast', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('exports sendBroadcast function', () => {
    expect(typeof newsletterService.sendBroadcast).toBe('function');
  });

  it('tüm doğrulanmış abonelere email gönderir', async () => {
    vi.mocked(prisma.newsletterSubscriber.findMany).mockResolvedValue(mockSubscribers as any);
    vi.mocked(sendEmail).mockResolvedValue({ success: true, messageId: 'm1' });

    const result = await newsletterService.sendBroadcast({
      subject: 'Test',
      html: '<p>Hello</p>',
    });

    expect(result.sent).toBe(3);
    expect(result.failed).toBe(0);
    expect(result.total).toBe(3);
    expect(sendEmail).toHaveBeenCalledTimes(3);
  });

  it('başarısız gönderimleri yakalar ve sayar', async () => {
    vi.mocked(prisma.newsletterSubscriber.findMany).mockResolvedValue(mockSubscribers as any);
    vi.mocked(sendEmail)
      .mockResolvedValueOnce({ success: true, messageId: 'm1' })
      .mockResolvedValueOnce({ success: false, error: 'rate limit' })
      .mockResolvedValueOnce({ success: true, messageId: 'm3' });

    const result = await newsletterService.sendBroadcast({
      subject: 'Test',
      html: '<p>Hello</p>',
    });

    expect(result.sent).toBe(2);
    expect(result.failed).toBe(1);
    expect(result.total).toBe(3);
  });

  it('email exception fırlatırsa failed olarak sayar (diğerleri devam eder)', async () => {
    vi.mocked(prisma.newsletterSubscriber.findMany).mockResolvedValue(mockSubscribers as any);
    vi.mocked(sendEmail)
      .mockResolvedValueOnce({ success: true, messageId: 'm1' })
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({ success: true, messageId: 'm3' });

    const result = await newsletterService.sendBroadcast({
      subject: 'Test',
      html: '<p>Hello</p>',
    });

    expect(result.sent).toBe(2);
    expect(result.failed).toBe(1);
    expect(result.total).toBe(3);
  });

  it('abone yoksa total=0 döner', async () => {
    vi.mocked(prisma.newsletterSubscriber.findMany).mockResolvedValue([]);

    const result = await newsletterService.sendBroadcast({
      subject: 'Test',
      html: '<p>Hello</p>',
    });

    expect(result.sent).toBe(0);
    expect(result.failed).toBe(0);
    expect(result.total).toBe(0);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('subject ve html parametrelerini sendEmail\'e geçirir', async () => {
    vi.mocked(prisma.newsletterSubscriber.findMany).mockResolvedValue([mockSubscribers[0]] as any);
    vi.mocked(sendEmail).mockResolvedValue({ success: true, messageId: 'm1' });

    await newsletterService.sendBroadcast({
      subject: 'Hello world',
      html: '<h1>Hi</h1>',
      text: 'Hi',
    });

    expect(sendEmail).toHaveBeenCalledWith({
      to: 'a@b.com',
      subject: 'Hello world',
      html: '<h1>Hi</h1>',
      text: 'Hi',
    });
  });

  it('geçersiz subject Zod hatası fırlatır (min 1 karakter)', async () => {
    await expect(
      newsletterService.sendBroadcast({ subject: '', html: '<p>x</p>' })
    ).rejects.toThrow();
  });
});
describe('NewsletterService.enqueueBroadcast', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('her abone için bir email job kuyruğa alır', async () => {
    vi.mocked(prisma.newsletterSubscriber.findMany).mockResolvedValue(mockSubscribers as any);

    const result = await newsletterService.enqueueBroadcast({
      subject: 'Test',
      html: '<p>Hello</p>',
    });

    expect(result.queued).toBe(3);
    expect(result.total).toBe(3);
    expect(queueService.sendEmail).toHaveBeenCalledTimes(3);
    expect(queueService.sendEmail).toHaveBeenCalledWith({
      to: 'a@b.com',
      subject: 'Test',
      html: '<p>Hello</p>',
      text: undefined,
    });
    // Kuyruğa alınır — senkron gönderim YAPILMAZ
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('abone yoksa hiç job üretmez', async () => {
    vi.mocked(prisma.newsletterSubscriber.findMany).mockResolvedValue([]);

    const result = await newsletterService.enqueueBroadcast({
      subject: 'Test',
      html: '<p>Hello</p>',
    });

    expect(result.queued).toBe(0);
    expect(queueService.sendEmail).not.toHaveBeenCalled();
  });
});
