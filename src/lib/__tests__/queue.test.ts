/**
 * Queue Tests
 *
 * InMemoryQueue davranışı, handler dispatch, retry ve factory seçimi.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { InMemoryQueue, createQueue, Jobs } from '../queue';
import { logger } from '@/lib/logger';

/** Bekleyen setTimeout(0) job'larının çalışmasını bekler. */
const flush = (ms = 20) => new Promise((r) => setTimeout(r, ms));

describe('InMemoryQueue', () => {
  let q: InMemoryQueue;

  beforeEach(() => {
    vi.clearAllMocks();
    q = new InMemoryQueue();
  });

  afterEach(async () => {
    await q.close();
  });

  it('driver olarak memory bildirir', () => {
    expect(q.driver).toBe('memory');
  });

  it('job ekler ve handler.ı data ile çağırır', async () => {
    const handler = vi.fn().mockResolvedValue(undefined);
    q.register(Jobs.MonitorCheck, handler);

    await q.add({ id: 'test1', name: Jobs.MonitorCheck, data: { monitorId: '1' } });
    await flush();

    expect(handler).toHaveBeenCalledWith({ monitorId: '1' });
  });

  it('add() handler bitmesini beklemez (fire-and-forget)', async () => {
    let resolved = false;
    q.register(Jobs.EmailSend, async () => {
      await flush(50);
      resolved = true;
    });

    await q.add({ id: 'e1', name: Jobs.EmailSend, data: {} });
    // add hemen döndü, handler henüz bitmedi
    expect(resolved).toBe(false);

    await flush(100);
    expect(resolved).toBe(true);
  });

  it('handler kayıtlı değilse uyarır ve job.ı düşürür', async () => {
    await q.add({ id: 'orphan', name: 'bilinmeyen.job', data: {} });
    await flush();

    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('handler bulunamadı'),
      expect.objectContaining({ job: 'bilinmeyen.job' })
    );
  });

  it('handler hatası diğer joblara sızmaz ve loglanır', async () => {
    const bad = vi.fn().mockRejectedValue(new Error('patladı'));
    const good = vi.fn().mockResolvedValue(undefined);
    q.register(Jobs.EmailSend, bad);
    q.register(Jobs.MonitorCheck, good);

    await q.add({ id: 'b1', name: Jobs.EmailSend, data: {} });
    await q.add({ id: 'g1', name: Jobs.MonitorCheck, data: {} });
    await flush();

    expect(bad).toHaveBeenCalled();
    expect(good).toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('başarısız'),
      expect.objectContaining({ id: 'b1', error: 'patladı' })
    );
  });

  it('delay verilen job.ı hemen çalıştırmaz', async () => {
    const handler = vi.fn().mockResolvedValue(undefined);
    q.register(Jobs.OrderExpire, handler);

    await q.add({ id: 'd1', name: Jobs.OrderExpire, data: {}, delay: 60 });
    await flush(10);
    expect(handler).not.toHaveBeenCalled();

    await flush(100);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('attempts > 1 ise başarısız job.ı yeniden dener', async () => {
    const handler = vi
      .fn()
      .mockRejectedValueOnce(new Error('geçici hata'))
      .mockResolvedValueOnce(undefined);
    q.register(Jobs.EmailSend, handler);

    await q.add({ id: 'r1', name: Jobs.EmailSend, data: {}, attempts: 2 });
    // İlk deneme + 1s backoff + ikinci deneme
    await flush(1200);

    expect(handler).toHaveBeenCalledTimes(2);
  });

  it('close() sonrası eklenen joblar çalışmaz', async () => {
    const handler = vi.fn().mockResolvedValue(undefined);
    q.register(Jobs.EmailSend, handler);
    await q.close();

    await q.add({ id: 'c1', name: Jobs.EmailSend, data: {} });
    await flush();

    expect(handler).not.toHaveBeenCalled();
  });

  it('close() bekleyen (delayed) jobları iptal eder', async () => {
    const handler = vi.fn().mockResolvedValue(undefined);
    q.register(Jobs.OrderExpire, handler);

    await q.add({ id: 'p1', name: Jobs.OrderExpire, data: {}, delay: 50 });
    await q.close();
    await flush(100);

    expect(handler).not.toHaveBeenCalled();
  });
});

describe('createQueue', () => {
  const original = process.env.REDIS_URL;

  afterEach(() => {
    if (original === undefined) delete process.env.REDIS_URL;
    else process.env.REDIS_URL = original;
  });

  it('REDIS_URL yoksa in-memory queue döner', () => {
    delete process.env.REDIS_URL;
    expect(createQueue().driver).toBe('memory');
  });

  it('REDIS_URL boş string ise in-memory queue döner', () => {
    process.env.REDIS_URL = '   ';
    expect(createQueue().driver).toBe('memory');
  });
});

describe('Jobs sabitleri', () => {
  it('tüm job adları benzersizdir', () => {
    const names = Object.values(Jobs);
    expect(new Set(names).size).toBe(names.length);
  });
});
