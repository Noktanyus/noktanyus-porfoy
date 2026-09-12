/**
 * Queue — BullMQ yükleme ve Redis fallback davranışı (item 4)
 *
 * Doğrulananlar:
 *   - `bullmq` yüklenemezse createQueue() PATLAMAZ, in-memory'e düşer
 *   - Redis 'error' event'i process'i öldürmez (listener bağlı)
 *   - Redis erişilemezken `add()` hata fırlatmaz (çağıran 500 dönmesin)
 *   - close() hatası yutulur
 *
 * NOT: Gerçek Redis bağlantısı kurulmaz. `BullMQQueue` constructor'ının
 * ikinci parametresi (test seam'i) ile sahte bir bull modülü verilir.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EventEmitter } from 'events';

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { createQueue, BullMQQueue, InMemoryQueue, Jobs } from '../queue';
import { logger } from '@/lib/logger';

/** Queue/Worker'ı EventEmitter olarak taklit eden sahte bullmq modülü. */
function fakeBull(opts: { addImpl?: () => Promise<void>; closeImpl?: () => Promise<void> } = {}) {
  const instances: { queue?: any; worker?: any } = {};

  class FakeQueue extends EventEmitter {
    add = vi.fn(opts.addImpl ?? (async () => undefined));
    close = vi.fn(opts.closeImpl ?? (async () => undefined));
    constructor(public name: string, public options: any) {
      super();
      instances.queue = this;
    }
  }

  class FakeWorker extends EventEmitter {
    close = vi.fn(async () => undefined);
    constructor(public name: string, public processor: any, public options: any) {
      super();
      instances.worker = this;
    }
  }

  return { module: { Queue: FakeQueue, Worker: FakeWorker }, instances };
}

describe('createQueue — fallback', () => {
  const original = process.env.REDIS_URL;
  /** Gerçek BullMQ üretilirse Redis bağlantısı açık kalmasın. */
  const opened: Array<{ close: () => Promise<void> }> = [];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    if (original === undefined) delete process.env.REDIS_URL;
    else process.env.REDIS_URL = original;
    // bullmq bu ortamda gerçekten yüklenebiliyor; açılan bağlantıları kapat.
    await Promise.all(opened.splice(0).map((q) => q.close().catch(() => undefined)));
  });

  it('REDIS_URL yoksa in-memory döner', () => {
    delete process.env.REDIS_URL;
    expect(createQueue().driver).toBe('memory');
  });

  it('REDIS_URL boşluk ise in-memory döner', () => {
    process.env.REDIS_URL = '   ';
    expect(createQueue().driver).toBe('memory');
  });

  it('REDIS_URL tanımlı olsa bile ASLA throw etmez ve geçerli bir Queue döner', () => {
    process.env.REDIS_URL = 'redis://localhost:6379';

    let q: ReturnType<typeof createQueue> | undefined;
    expect(() => {
      q = createQueue();
    }).not.toThrow();

    expect(q).toBeDefined();
    opened.push(q!);
    expect(['bullmq', 'memory']).toContain(q!.driver);
    expect(typeof q!.add).toBe('function');
    expect(typeof q!.register).toBe('function');
  });

  it('geçersiz REDIS_URL ile de throw etmez', () => {
    process.env.REDIS_URL = 'not-a-valid-url::::';
    let q: ReturnType<typeof createQueue> | undefined;
    expect(() => {
      q = createQueue();
    }).not.toThrow();
    opened.push(q!);
  });

  it('BullMQ kurulamazsa in-memory.ye düşer ve loglar', () => {
    process.env.REDIS_URL = 'redis://localhost:6379';
    const q = createQueue();
    opened.push(q);

    if (q.driver === 'memory') {
      // Fallback yolu: bullmq yüklenemedi ya da kurulum patladı → log şart.
      const logged =
        vi.mocked(logger.error).mock.calls.some((c) =>
          String(c[0]).includes('in-memory')
        ) ||
        vi.mocked(logger.warn).mock.calls.some((c) => String(c[0]).includes('bullmq'));
      expect(logged).toBe(true);
    } else {
      expect(q.driver).toBe('bullmq');
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('BullMQ + Redis queue aktif')
      );
    }
  });
});

describe('BullMQQueue — kontrollü hata yönetimi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('bullmq modülü yoksa constructor anlamlı hata fırlatır (createQueue yakalar)', () => {
    expect(() => new BullMQQueue('redis://x', null)).toThrow(/bullmq/);
  });

  it('queue.ya "error" listener.ı bağlanır (unhandled error process.i öldürmesin)', () => {
    const { module, instances } = fakeBull();
    new BullMQQueue('redis://localhost:6379', module);

    expect(instances.queue!.listenerCount('error')).toBeGreaterThan(0);
  });

  it('queue "error" event.i loglanır ve YUTULUR', () => {
    const { module, instances } = fakeBull();
    new BullMQQueue('redis://localhost:6379', module);

    // Listener yoksa Node bunu throw'a çevirir.
    expect(() =>
      instances.queue!.emit('error', new Error('ECONNREFUSED 127.0.0.1:6379'))
    ).not.toThrow();

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('bağlantı/altyapı hatası'),
      expect.objectContaining({ scope: 'queue', error: 'ECONNREFUSED 127.0.0.1:6379' })
    );
  });

  it('worker.a da "error" listener.ı bağlanır', () => {
    const { module, instances } = fakeBull();
    const q = new BullMQQueue('redis://localhost:6379', module);

    q.register(Jobs.EmailSend, async () => undefined);

    expect(instances.worker).toBeDefined();
    expect(instances.worker!.listenerCount('error')).toBeGreaterThan(0);
    expect(() =>
      instances.worker!.emit('error', new Error('worker redis down'))
    ).not.toThrow();
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('bağlantı/altyapı hatası'),
      expect.objectContaining({ scope: 'worker' })
    );
  });

  it('worker yalnızca ilk register.da bir kez oluşturulur (lazy)', () => {
    const { module, instances } = fakeBull();
    const q = new BullMQQueue('redis://localhost:6379', module);

    q.register(Jobs.EmailSend, async () => undefined);
    const firstWorker = instances.worker;
    q.register(Jobs.MonitorCheck, async () => undefined);

    expect(instances.worker).toBe(firstWorker);
  });

  it('Redis erişilemezken add() FIRLATMAZ, hatayı loglar', async () => {
    const { module } = fakeBull({
      addImpl: async () => {
        throw new Error('Connection is closed');
      },
    });
    const q = new BullMQQueue('redis://localhost:6379', module);

    await expect(
      q.add({ id: 'j1', name: Jobs.EmailSend, data: {} })
    ).resolves.toBeUndefined();

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('kuyruğa eklenemedi'),
      expect.objectContaining({ job: Jobs.EmailSend, error: 'Connection is closed' })
    );
  });

  it('add() job parametrelerini BullMQ.ye doğru geçirir', async () => {
    const { module, instances } = fakeBull();
    const q = new BullMQQueue('redis://localhost:6379', module);

    await q.add({
      id: 'job-id-1',
      name: Jobs.OrderPostCheckout,
      data: { orderId: 'o1' },
      delay: 500,
      attempts: 1,
    });

    expect(instances.queue!.add).toHaveBeenCalledWith(
      Jobs.OrderPostCheckout,
      { orderId: 'o1' },
      { jobId: 'job-id-1', delay: 500, attempts: 1 }
    );
  });

  it('attempts verilmezse BullMQ varsayılanı 3 olur', async () => {
    const { module, instances } = fakeBull();
    const q = new BullMQQueue('redis://localhost:6379', module);

    await q.add({ id: 'j', name: Jobs.EmailSend, data: {} });

    expect(instances.queue!.add.mock.calls[0][2]).toMatchObject({ attempts: 3 });
  });

  it('worker processor.ı kayıtlı handler.ı çağırır', async () => {
    const { module, instances } = fakeBull();
    const q = new BullMQQueue('redis://localhost:6379', module);
    const handler = vi.fn(async () => undefined);

    q.register(Jobs.EmailSend, handler);
    await instances.worker!.processor({ name: Jobs.EmailSend, data: { to: 'a@b' }, id: '1' });

    expect(handler).toHaveBeenCalledWith({ to: 'a@b' });
  });

  it('worker processor.ı handler hatasını YUKARI fırlatır (BullMQ retry tetiklesin)', async () => {
    const { module, instances } = fakeBull();
    const q = new BullMQQueue('redis://localhost:6379', module);

    q.register(Jobs.EmailSend, async () => {
      throw new Error('SMTP down');
    });

    await expect(
      instances.worker!.processor({ name: Jobs.EmailSend, data: {}, id: '1' })
    ).rejects.toThrow('SMTP down');
  });

  it('kayıtsız job adı worker.da uyarı üretir, throw etmez', async () => {
    const { module, instances } = fakeBull();
    const q = new BullMQQueue('redis://localhost:6379', module);
    q.register(Jobs.EmailSend, async () => undefined);

    await expect(
      instances.worker!.processor({ name: 'bilinmeyen.job', data: {}, id: '9' })
    ).resolves.toBeUndefined();

    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('handler bulunamadı'),
      expect.objectContaining({ job: 'bilinmeyen.job' })
    );
  });

  it('close() hatası yutulur', async () => {
    const { module } = fakeBull({
      closeImpl: async () => {
        throw new Error('close failed');
      },
    });
    const q = new BullMQQueue('redis://localhost:6379', module);

    await expect(q.close()).resolves.toBeUndefined();
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('kapatılırken hata'),
      expect.anything()
    );
  });

  it('close() sonrası add() sessizce no-op olur', async () => {
    const { module, instances } = fakeBull();
    const q = new BullMQQueue('redis://localhost:6379', module);

    await q.close();
    await expect(
      q.add({ id: 'j', name: Jobs.EmailSend, data: {} })
    ).resolves.toBeUndefined();
    expect(instances.queue!.add).not.toHaveBeenCalled();
  });

  it('driver "bullmq" bildirir', () => {
    const { module } = fakeBull();
    expect(new BullMQQueue('redis://localhost:6379', module).driver).toBe('bullmq');
  });
});

describe('InMemoryQueue — Queue arayüz uyumu', () => {
  it('BullMQQueue ile aynı yüzeyi sağlar', () => {
    const mem = new InMemoryQueue();
    const { module } = fakeBull();
    const bull = new BullMQQueue('redis://x', module);

    for (const key of ['add', 'register', 'close'] as const) {
      expect(typeof mem[key]).toBe('function');
      expect(typeof bull[key]).toBe('function');
    }
    expect(mem.driver).toBe('memory');
    expect(bull.driver).toBe('bullmq');
  });
});
