/**
 * Queue Service Tests
 *
 * Enqueue yardımcılarının doğru job adı/attempts/id ile kuyruğa yazdığını ve
 * kritik yolda (checkout/webhook) enqueue hatasının YUTULDUĞUNU doğrular.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock('@/lib/queue', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/queue')>();
  return { ...actual, queue: new actual.InMemoryQueue() };
});

// registerQueueHandlers'ın gerçek handler'larını kaydetmesini istemiyoruz;
// burada sadece enqueue sözleşmesi test ediliyor.
vi.mock('@/lib/queueHandlers', () => ({
  registerQueueHandlers: vi.fn(),
}));

import { queue, Jobs } from '@/lib/queue';
import { logger } from '@/lib/logger';
import { queueService } from '@/lib/queueService';

describe('queueService.enqueueOrderPostCheckout (item 7)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('OrderPostCheckout job.ını attempts=1 ile kuyruğa alır', async () => {
    const addSpy = vi.spyOn(queue, 'add').mockResolvedValue(undefined);

    await queueService.enqueueOrderPostCheckout({ orderId: 'order_1' });

    expect(addSpy).toHaveBeenCalledWith({
      id: 'order-post-checkout-order_1',
      name: Jobs.OrderPostCheckout,
      data: { orderId: 'order_1' },
      attempts: 1,
    });
    addSpy.mockRestore();
  });

  it('job id order.a bağlı ve deterministik (BullMQ deduplication)', async () => {
    const addSpy = vi.spyOn(queue, 'add').mockResolvedValue(undefined);

    await queueService.enqueueOrderPostCheckout({ orderId: 'order_9' });
    await queueService.enqueueOrderPostCheckout({ orderId: 'order_9' });

    const ids = addSpy.mock.calls.map((c) => (c[0] as any).id);
    expect(ids[0]).toBe(ids[1]);
    addSpy.mockRestore();
  });

  it('enqueue hatası YUTULUR ve loglanır (webhook 500 dönmemeli)', async () => {
    const addSpy = vi
      .spyOn(queue, 'add')
      .mockRejectedValue(new Error('Redis connection refused'));

    await expect(
      queueService.enqueueOrderPostCheckout({ orderId: 'order_1' })
    ).resolves.toBeUndefined();

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('kuyruğa eklenemedi'),
      expect.objectContaining({
        orderId: 'order_1',
        error: 'Redis connection refused',
      })
    );
    addSpy.mockRestore();
  });
});

describe('queueService — diğer enqueue yardımcıları', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sendEmail → EmailSend, attempts=3', async () => {
    const addSpy = vi.spyOn(queue, 'add').mockResolvedValue(undefined);

    await queueService.sendEmail({ to: 'a@b.com', subject: 'S', html: 'H' });

    expect(addSpy).toHaveBeenCalledWith(
      expect.objectContaining({ name: Jobs.EmailSend, attempts: 3 })
    );
    addSpy.mockRestore();
  });

  it('broadcastNewsletter → NewsletterBroadcast, attempts=1', async () => {
    const addSpy = vi.spyOn(queue, 'add').mockResolvedValue(undefined);

    await queueService.broadcastNewsletter({ subject: 'S', html: 'H' });

    expect(addSpy).toHaveBeenCalledWith(
      expect.objectContaining({ name: Jobs.NewsletterBroadcast, attempts: 1 })
    );
    addSpy.mockRestore();
  });

  it('broadcastNewsletter abone listesini ÇÖZMEZ (worker içinde çözülür)', async () => {
    const addSpy = vi.spyOn(queue, 'add').mockResolvedValue(undefined);

    await queueService.broadcastNewsletter({ subject: 'S', html: 'H' });

    const data = (addSpy.mock.calls[0]![0] as any).data;
    expect(data).not.toHaveProperty('recipients');
    expect(data).toEqual({ subject: 'S', html: 'H', text: undefined });
    addSpy.mockRestore();
  });

  it('scheduleMonitorCheck → MonitorCheck, attempts=2, delay geçirilir', async () => {
    const addSpy = vi.spyOn(queue, 'add').mockResolvedValue(undefined);

    await queueService.scheduleMonitorCheck('m1', 5000);

    expect(addSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        name: Jobs.MonitorCheck,
        data: { monitorId: 'm1' },
        delay: 5000,
        attempts: 2,
      })
    );
    addSpy.mockRestore();
  });

  it('scheduleBulkGeneration → AiBulkGenerate, deterministik id', async () => {
    const addSpy = vi.spyOn(queue, 'add').mockResolvedValue(undefined);

    await queueService.scheduleBulkGeneration({ jobId: 'j1', userId: 'u1' });

    expect(addSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'ai-bulk-j1',
        name: Jobs.AiBulkGenerate,
        attempts: 2,
      })
    );
    addSpy.mockRestore();
  });

  it('driver getter aktif queue driver.ını yansıtır', () => {
    expect(queueService.driver).toBe('memory');
  });
});
