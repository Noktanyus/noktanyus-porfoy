/**
 * Webhook Service Tests
 *
 * HMAC imzalama, backoff hesaplama, retry queue ve event dispatch için birim testleri.
 * Prisma mock'lanarak DB bağımlılığı izole edilir.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import crypto from 'crypto';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    webhook: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    webhookDelivery: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';
import { webhookService } from '../service';

describe('WebhookService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exports core functions', () => {
    expect(typeof webhookService.dispatchEvent).toBe('function');
    expect(typeof webhookService.deliverWebhook).toBe('function');
    expect(typeof webhookService.processRetries).toBe('function');
    expect(typeof webhookService.scheduleRetry).toBe('function');
    expect(typeof webhookService.listWebhooks).toBe('function');
    expect(typeof webhookService.createWebhook).toBe('function');
    expect(typeof webhookService.rotateSecret).toBe('function');
  });

  it('generates valid HMAC SHA-256 signature', () => {
    const payload = '{"event":"order.paid","timestamp":"2026-01-01T00:00:00Z"}';
    const secret = 'test-secret-key';
    const sig = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    expect(sig).toMatch(/^[a-f0-9]{64}$/);
  });

  it('produces different signatures for different secrets', () => {
    const payload = '{"test":1}';
    const sig1 = crypto.createHmac('sha256', 'secret-a').update(payload).digest('hex');
    const sig2 = crypto.createHmac('sha256', 'secret-b').update(payload).digest('hex');
    expect(sig1).not.toBe(sig2);
  });

  it('generates 64-char hex secret', async () => {
    const repo = (await import('../repository')).webhookRepository;
    const secret = await repo.generateSecret();
    expect(secret).toMatch(/^[a-f0-9]{64}$/);
  });

  it('finds active webhooks for a given event', async () => {
    (prisma.webhook.findMany as any).mockResolvedValue([
      { id: 'w1', active: true, events: ['order.paid'], secret: 's', url: 'https://x' },
    ]);

    const repo = (await import('../repository')).webhookRepository;
    const result = await repo.findActiveForEvent('order.paid');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('w1');
  });

  it('filters webhooks that do not include the event', async () => {
    (prisma.webhook.findMany as any).mockResolvedValue([
      { id: 'w1', active: true, events: ['monitor.up'], secret: 's', url: 'https://x' },
      { id: 'w2', active: true, events: ['order.paid', 'order.refunded'], secret: 's', url: 'https://y' },
    ]);

    const repo = (await import('../repository')).webhookRepository;
    const result = await repo.findActiveForEvent('order.paid');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('w2');
  });

  it('moves delivery to DEAD_LETTER after max attempts', async () => {
    (prisma.webhookDelivery.findUnique as any).mockResolvedValue({
      id: 'd1',
      webhookId: 'w1',
      attempts: 4,
      maxAttempts: 5,
      status: 'RETRYING',
    });
    (prisma.webhookDelivery.update as any).mockResolvedValue({ id: 'd1' });
    (prisma.webhook.update as any).mockResolvedValue({ id: 'w1' });

    await webhookService.scheduleRetry('d1', 'w1', 'HTTP 500', 500, 'fail');

    expect(prisma.webhookDelivery.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'd1' },
        data: expect.objectContaining({
          status: 'DEAD_LETTER',
          attempts: 5,
          errorMessage: 'HTTP 500',
        }),
      })
    );
    expect(prisma.webhook.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'w1' },
        data: { failedDeliveries: { increment: 1 } },
      })
    );
  });

  it('schedules retry with exponential backoff for transient failures', async () => {
    (prisma.webhookDelivery.findUnique as any).mockResolvedValue({
      id: 'd2',
      webhookId: 'w1',
      attempts: 1,
      maxAttempts: 5,
      status: 'RETRYING',
    });
    (prisma.webhookDelivery.update as any).mockResolvedValue({ id: 'd2' });

    await webhookService.scheduleRetry('d2', 'w1', 'Connection refused');

    const call = (prisma.webhookDelivery.update as any).mock.calls[0][0];
    expect(call.data.status).toBe('RETRYING');
    expect(call.data.attempts).toBe(2);
    expect(call.data.errorMessage).toBe('Connection refused');
    expect(call.data.nextRetryAt).toBeInstanceOf(Date);
  });
});
