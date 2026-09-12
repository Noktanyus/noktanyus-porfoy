/**
 * Queue Handler Registry Tests (item 4 + 6)
 *
 * Kapsam:
 *   - REGISTRY BÜTÜNLÜĞÜ: `Jobs` içindeki her job adı için handler var mı?
 *     (Eskiden AiBulkRowRetry, DLQ ve tüm breach job'ları için handler YOKTU;
 *      job'lar "handler bulunamadı" uyarısıyla sessizce düşüyordu.)
 *   - TÜM job tipleri için dispatch + retry davranışı
 *   - Handler'ların doğru servise delege etmesi
 *   - Newsletter broadcast'in batch'lenmesi (sınırsız await döngüsü kaldırıldı)
 *   - Implementasyonu olmayan job'ların sessiz değil GÜRÜLTÜLÜ düşmesi
 *
 * Bu dosya HERMETİK'tir: handler'ların dinamik import ettiği tüm servisler
 * mock'lanır, gerçek DB/SMTP/HTTP çağrısı yapılmaz.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

// Singleton queue'yu izole bir InMemoryQueue ile değiştir; geri kalan her şey
// (Jobs, InMemoryQueue, createQueue) gerçek kalır.
vi.mock('@/lib/queue', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/queue')>();
  return { ...actual, queue: new actual.InMemoryQueue() };
});

// --- Handler'ların dinamik import ettiği servisler ---
const mockSendEmail = vi.fn(async () => ({ success: true }) as any);
vi.mock('@/lib/email', () => ({ sendEmail: mockSendEmail }));

const mockProcessMonitorCheck = vi.fn(async () => undefined);
vi.mock('@/modules/monitoring/service', () => ({
  monitoringService: { processMonitorCheck: mockProcessMonitorCheck },
}));

const mockFindVerifiedActive = vi.fn(async () => [] as Array<{ id: string; email: string }>);
vi.mock('@/modules/newsletter/repository', () => ({
  newsletterRepository: { findVerifiedActive: mockFindVerifiedActive },
}));

const mockRunPostCheckout = vi.fn(async () => ({ orderId: 'o1', found: true }));
vi.mock('@/modules/commerce/postCheckout', () => ({
  runPostCheckoutSideEffects: mockRunPostCheckout,
}));

const mockProcessBulkGeneration = vi.fn(async () => ({
  successfulRows: 1,
  failedRows: 0,
  skippedRows: 0,
}));
const mockProcessRowRetry = vi.fn(async () => ({ status: 'ok' }));
const mockProcessDeadLetter = vi.fn(async () => ({
  emailSent: true,
  deadLetterCount: 1,
  csvUrl: null,
}));
vi.mock('@/modules/ai-bulk/service', () => ({
  processBulkGeneration: mockProcessBulkGeneration,
  processRowRetry: mockProcessRowRetry,
  processDeadLetterNotification: mockProcessDeadLetter,
}));

const mockDemoDeploy = vi.fn(async () => ({
  installationId: 'inst1',
  deploymentUrl: 'https://x',
}));
vi.mock('@/modules/marketplace/demoService', () => ({
  demoService: { deploy: mockDemoDeploy },
}));

const mockRunComplianceScan = vi.fn(async () => ({
  score: 90,
  cookiesCount: 1,
  threatsCount: 0,
}));
vi.mock('@/modules/compliance/queueHandlers', () => ({
  runComplianceScan: mockRunComplianceScan,
}));

const mockRunScheduledScans = vi.fn(async () => ({
  queuedCount: 1,
  skippedCount: 0,
  errors: [],
}));
vi.mock('@/modules/compliance/scheduler', () => ({
  runScheduledScans: mockRunScheduledScans,
}));

const mockNotifyAffectedUsers = vi.fn(async () => undefined);
const mockMaybeAutoSubmit = vi.fn(async () => undefined);
const mockProcessCheckBreaches = vi.fn(async () => ({}) as any);
vi.mock('@/modules/compliance/breachDetector', () => ({
  notifyAffectedUsers: mockNotifyAffectedUsers,
  maybeAutoSubmitToVerbis: mockMaybeAutoSubmit,
  processCheckBreaches: mockProcessCheckBreaches,
}));

const mockBreachFindUnique = vi.fn(async () => ({ workspaceId: 'ws1' }));
vi.mock('@/lib/prisma', () => ({
  prisma: { dataBreachIncident: { findUnique: mockBreachFindUnique } },
}));

import { queue, Jobs, InMemoryQueue, type JobName } from '@/lib/queue';
import {
  buildJobHandlers,
  registerQueueHandlers,
  chunk,
  BROADCAST_BATCH_SIZE,
  UNIMPLEMENTED_JOBS,
} from '@/lib/queueHandlers';
import { logger } from '@/lib/logger';

/** Bekleyen setTimeout(0) job'larının çalışmasını bekler. */
const flush = (ms = 20) => new Promise((r) => setTimeout(r, ms));

const ALL_JOB_NAMES = Object.values(Jobs) as JobName[];

function subscribers(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: `sub_${i}`,
    email: `user${i}@example.com`,
  }));
}

describe('Registry bütünlüğü', () => {
  it('Jobs içindeki HER job adı için bir handler kayıtlı', () => {
    const handlers = buildJobHandlers();
    const missing = ALL_JOB_NAMES.filter((name) => typeof handlers[name] !== 'function');

    expect(missing).toEqual([]);
    expect(Object.keys(handlers).sort()).toEqual([...ALL_JOB_NAMES].sort());
  });

  it('handler sayısı job sayısına eşit (fazla/eksik kayıt yok)', () => {
    expect(Object.keys(buildJobHandlers())).toHaveLength(ALL_JOB_NAMES.length);
  });

  it('eskiden handler.ı olmayan job.lar artık kayıtlı', () => {
    const handlers = buildJobHandlers();
    // Bunlar merkezi dosyada YOKTU (modül registrar'ları hiç çağrılmıyordu).
    for (const name of [
      Jobs.AiBulkRowRetry,
      Jobs.AiBulkGenerateDeadLetter,
      Jobs.BreachDeadlineReminder,
      Jobs.AutoSubmitBreachToVerbis,
      Jobs.BreachDeadlineCron,
    ]) {
      expect(typeof handlers[name]).toBe('function');
    }
  });

  it('registerQueueHandlers tüm handler.ları hedef queue.ya kaydeder', () => {
    const target = new InMemoryQueue();
    const spy = vi.spyOn(target, 'register');

    registerQueueHandlers(target);

    expect(spy).toHaveBeenCalledTimes(ALL_JOB_NAMES.length);
    expect(spy.mock.calls.map((c) => c[0]).sort()).toEqual([...ALL_JOB_NAMES].sort());
  });

  it('registerQueueHandlers aynı queue için idempotenttir', () => {
    const target = new InMemoryQueue();
    const spy = vi.spyOn(target, 'register');

    registerQueueHandlers(target);
    registerQueueHandlers(target);
    registerQueueHandlers(target);

    expect(spy).toHaveBeenCalledTimes(ALL_JOB_NAMES.length);
  });
});

describe('Tüm job tipleri — queue üzerinden dispatch', () => {
  let q: InMemoryQueue;

  beforeEach(() => {
    vi.clearAllMocks();
    q = new InMemoryQueue();
  });

  afterEach(async () => {
    await q.close();
  });

  for (const jobName of ALL_JOB_NAMES) {
    it(`${jobName} → handler data ile çağrılır`, async () => {
      const handler = vi.fn().mockResolvedValue(undefined);
      q.register(jobName, handler);

      await q.add({ id: `disp_${jobName}`, name: jobName, data: { probe: jobName } });
      await flush();

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith({ probe: jobName });
    });
  }

  it('GERÇEK registry ile hiçbir job adı düşmez (uçtan uca)', async () => {
    mockFindVerifiedActive.mockResolvedValue([]);
    registerQueueHandlers(q);

    for (const jobName of ALL_JOB_NAMES) {
      await q.add({ id: `e2e_${jobName}`, name: jobName, data: {} });
    }
    await flush(80);

    const notFound = vi
      .mocked(logger.warn)
      .mock.calls.filter((c) => String(c[0]).includes('handler bulunamadı'));
    expect(notFound).toEqual([]);
  });
});

describe('Tüm job tipleri — retry', () => {
  let q: InMemoryQueue;

  beforeEach(() => {
    vi.clearAllMocks();
    // Gerçek 1s exponential backoff'u beklemeyelim.
    vi.useFakeTimers();
    q = new InMemoryQueue();
  });

  afterEach(async () => {
    vi.useRealTimers();
    await q.close();
  });

  for (const jobName of ALL_JOB_NAMES) {
    it(`${jobName} → attempts=2 ise başarısız denemeden sonra tekrar denenir`, async () => {
      const handler = vi
        .fn()
        .mockRejectedValueOnce(new Error('geçici hata'))
        .mockResolvedValueOnce(undefined);
      q.register(jobName, handler);

      await q.add({ id: `retry_${jobName}`, name: jobName, data: {}, attempts: 2 });
      // 1. deneme + 1s backoff + 2. deneme
      await vi.advanceTimersByTimeAsync(1100);

      expect(handler).toHaveBeenCalledTimes(2);
    });
  }

  it('attempts=1 (varsayılan) ise tekrar denenmez', async () => {
    const handler = vi.fn().mockRejectedValue(new Error('kalıcı hata'));
    q.register(Jobs.OrderPostCheckout, handler);

    await q.add({ id: 'no_retry', name: Jobs.OrderPostCheckout, data: {} });
    await vi.advanceTimersByTimeAsync(3000);

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('tüm denemeler tükenirse hata loglanır ve dışarı sızmaz', async () => {
    const handler = vi.fn().mockRejectedValue(new Error('hep patlıyor'));
    q.register(Jobs.EmailSend, handler);

    await q.add({ id: 'fail_all', name: Jobs.EmailSend, data: {}, attempts: 2 });
    await vi.advanceTimersByTimeAsync(1500);

    expect(handler).toHaveBeenCalledTimes(2);
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('başarısız'),
      expect.objectContaining({ id: 'fail_all', willRetry: false })
    );
  });

  it('exponential backoff uygulanır (1s, 2s)', async () => {
    const handler = vi.fn().mockRejectedValue(new Error('x'));
    q.register(Jobs.EmailSend, handler);

    await q.add({ id: 'backoff', name: Jobs.EmailSend, data: {}, attempts: 3 });

    await vi.advanceTimersByTimeAsync(0);
    expect(handler).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1000); // 1s backoff
    expect(handler).toHaveBeenCalledTimes(2);

    await vi.advanceTimersByTimeAsync(1999); // 2s backoff henüz dolmadı
    expect(handler).toHaveBeenCalledTimes(2);

    await vi.advanceTimersByTimeAsync(1);
    expect(handler).toHaveBeenCalledTimes(3);
  });
});

describe('Handler delegasyonu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('EmailSend → sendEmail çağırır', async () => {
    const handlers = buildJobHandlers();
    await handlers[Jobs.EmailSend]({ to: 'a@b.com', subject: 'S', html: 'H' });
    expect(mockSendEmail).toHaveBeenCalledWith({ to: 'a@b.com', subject: 'S', html: 'H' });
  });

  it('EmailSend → success:false ise retry için FIRLATIR', async () => {
    mockSendEmail.mockResolvedValueOnce({ success: false, error: 'SMTP down' } as any);
    const handlers = buildJobHandlers();
    await expect(
      handlers[Jobs.EmailSend]({ to: 'a@b.com', subject: 'S', html: 'H' })
    ).rejects.toThrow('SMTP down');
  });

  it('MonitorCheck → processMonitorCheck çağırır', async () => {
    const handlers = buildJobHandlers();
    await handlers[Jobs.MonitorCheck]({ monitorId: 'm1' });
    expect(mockProcessMonitorCheck).toHaveBeenCalledWith('m1');
  });

  it('OrderPostCheckout → runPostCheckoutSideEffects çağırır', async () => {
    const handlers = buildJobHandlers();
    await handlers[Jobs.OrderPostCheckout]({ orderId: 'order_1' });
    expect(mockRunPostCheckout).toHaveBeenCalledWith('order_1');
  });

  it('AiBulkGenerate → processBulkGeneration çağırır', async () => {
    const handlers = buildJobHandlers();
    await handlers[Jobs.AiBulkGenerate]({ jobId: 'j1', userId: 'u1' });
    expect(mockProcessBulkGeneration).toHaveBeenCalledWith('j1');
  });

  it('AiBulkRowRetry → processRowRetry çağırır', async () => {
    const handlers = buildJobHandlers();
    await handlers[Jobs.AiBulkRowRetry]({ jobId: 'j1', rowIndex: 4 });
    expect(mockProcessRowRetry).toHaveBeenCalledWith('j1', 4);
  });

  it('AiBulkRowRetry rowIndex=0 geçerlidir (falsy tuzağı)', async () => {
    const handlers = buildJobHandlers();
    await handlers[Jobs.AiBulkRowRetry]({ jobId: 'j1', rowIndex: 0 });
    expect(mockProcessRowRetry).toHaveBeenCalledWith('j1', 0);
  });

  it('AiBulkGenerateDeadLetter → processDeadLetterNotification çağırır', async () => {
    const handlers = buildJobHandlers();
    await handlers[Jobs.AiBulkGenerateDeadLetter]({ jobId: 'j1' });
    expect(mockProcessDeadLetter).toHaveBeenCalledWith('j1');
  });

  it('TemplateDemoDeploy → demoService.deploy çağırır', async () => {
    const handlers = buildJobHandlers();
    await handlers[Jobs.TemplateDemoDeploy]({
      templateSlug: 't1',
      licenseKey: 'k1',
      subdomain: 'demo',
    });
    expect(mockDemoDeploy).toHaveBeenCalledWith({ licenseKey: 'k1', subdomain: 'demo' });
  });

  it('TemplateDemoDeploy hata FIRLATIR (retry tetiklensin)', async () => {
    mockDemoDeploy.mockRejectedValueOnce(new Error('vercel down'));
    const handlers = buildJobHandlers();
    await expect(
      handlers[Jobs.TemplateDemoDeploy]({
        templateSlug: 't1',
        licenseKey: 'k1',
        subdomain: 'demo',
      })
    ).rejects.toThrow('vercel down');
  });

  it('ComplianceScan → runComplianceScan çağırır', async () => {
    const handlers = buildJobHandlers();
    await handlers[Jobs.ComplianceScan]({ scanId: 's1', siteId: 'site1' });
    expect(mockRunComplianceScan).toHaveBeenCalledWith('s1');
  });

  it('ComplianceScan hata FIRLATIR (retry tetiklensin)', async () => {
    mockRunComplianceScan.mockRejectedValueOnce(new Error('playwright fail'));
    const handlers = buildJobHandlers();
    await expect(
      handlers[Jobs.ComplianceScan]({ scanId: 's1', siteId: 'site1' })
    ).rejects.toThrow('playwright fail');
  });

  it('ComplianceMonitor → runScheduledScans çağırır', async () => {
    const handlers = buildJobHandlers();
    await handlers[Jobs.ComplianceMonitor]({ triggeredAt: 'now' });
    expect(mockRunScheduledScans).toHaveBeenCalled();
  });

  it('BreachDeadlineReminder → breach.i bulup notifyAffectedUsers çağırır', async () => {
    const handlers = buildJobHandlers();
    await handlers[Jobs.BreachDeadlineReminder]({ breachId: 'b1' });
    expect(mockBreachFindUnique).toHaveBeenCalled();
    expect(mockNotifyAffectedUsers).toHaveBeenCalledWith('ws1', 'b1');
  });

  it('BreachDeadlineReminder → breach yoksa uyarır, notify çağırmaz', async () => {
    mockBreachFindUnique.mockResolvedValueOnce(null as any);
    const handlers = buildJobHandlers();
    await handlers[Jobs.BreachDeadlineReminder]({ breachId: 'yok' });
    expect(mockNotifyAffectedUsers).not.toHaveBeenCalled();
  });

  it('AutoSubmitBreachToVerbis → maybeAutoSubmitToVerbis çağırır', async () => {
    const handlers = buildJobHandlers();
    await handlers[Jobs.AutoSubmitBreachToVerbis]({ breachId: 'b1' });
    expect(mockMaybeAutoSubmit).toHaveBeenCalledWith('b1');
  });

  it('BreachDeadlineCron → processCheckBreaches çağırır', async () => {
    const handlers = buildJobHandlers();
    await handlers[Jobs.BreachDeadlineCron](undefined);
    expect(mockProcessCheckBreaches).toHaveBeenCalled();
  });
});

describe('chunk yardımcısı', () => {
  it('diziyi sabit boyutlu parçalara böler', () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it('tam bölünen diziyi eşit parçalara ayırır', () => {
    expect(chunk([1, 2, 3, 4], 2)).toEqual([
      [1, 2],
      [3, 4],
    ]);
  });

  it('boş dizi için boş sonuç döner', () => {
    expect(chunk([], 10)).toEqual([]);
  });

  it('parça boyutu diziden büyükse tek parça döner', () => {
    expect(chunk([1, 2], 100)).toEqual([[1, 2]]);
  });

  it('geçersiz boyutta hata fırlatır (sonsuz döngü koruması)', () => {
    expect(() => chunk([1], 0)).toThrow();
    expect(() => chunk([1], -1)).toThrow();
  });
});

describe('Newsletter broadcast — batch üretimi (item 6)', () => {
  let addSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    addSpy = vi.spyOn(queue, 'add').mockResolvedValue(undefined) as unknown as ReturnType<
      typeof vi.fn
    >;
  });

  afterEach(() => {
    addSpy.mockRestore();
  });

  it('broadcast handler.ı abone başına DEĞİL, batch başına job üretir', async () => {
    mockFindVerifiedActive.mockResolvedValue(subscribers(250));

    const handlers = buildJobHandlers();
    await handlers[Jobs.NewsletterBroadcast]({ subject: 'S', html: '<p>H</p>' });

    // 250 abone / 100 = 3 batch job'ı (eskiden 250 EmailSend job'ı olurdu)
    expect(addSpy).toHaveBeenCalledTimes(3);
    for (const call of addSpy.mock.calls) {
      expect((call[0] as any).name).toBe(Jobs.NewsletterBroadcastBatch);
    }
  });

  it('her batch en fazla BROADCAST_BATCH_SIZE alıcı içerir', async () => {
    mockFindVerifiedActive.mockResolvedValue(subscribers(250));

    const handlers = buildJobHandlers();
    await handlers[Jobs.NewsletterBroadcast]({ subject: 'S', html: 'H' });

    const sizes = addSpy.mock.calls.map(
      (c) => (c[0] as any).data.recipients.length as number
    );
    expect(sizes).toEqual([100, 100, 50]);
    expect(Math.max(...sizes)).toBeLessThanOrEqual(BROADCAST_BATCH_SIZE);
  });

  it('batch metadata (index/count) doğru', async () => {
    mockFindVerifiedActive.mockResolvedValue(subscribers(150));

    const handlers = buildJobHandlers();
    await handlers[Jobs.NewsletterBroadcast]({ subject: 'S', html: 'H' });

    const datas = addSpy.mock.calls.map((c) => (c[0] as any).data);
    expect(datas.map((d: any) => d.batchIndex)).toEqual([0, 1]);
    expect(datas.every((d: any) => d.batchCount === 2)).toBe(true);
  });

  it('subject/html/text her batch.e taşınır', async () => {
    mockFindVerifiedActive.mockResolvedValue(subscribers(5));

    const handlers = buildJobHandlers();
    await handlers[Jobs.NewsletterBroadcast]({
      subject: 'Konu',
      html: '<b>x</b>',
      text: 'x',
    });

    const data = (addSpy.mock.calls[0]![0] as any).data;
    expect(data).toMatchObject({ subject: 'Konu', html: '<b>x</b>', text: 'x' });
  });

  it('abone yoksa hiç batch üretilmez', async () => {
    mockFindVerifiedActive.mockResolvedValue([]);

    const handlers = buildJobHandlers();
    await handlers[Jobs.NewsletterBroadcast]({ subject: 'S', html: 'H' });

    expect(addSpy).not.toHaveBeenCalled();
  });

  it('10.000 abonede batch sayısı 100 (döngü abone sayısıyla ölçeklenmez)', async () => {
    mockFindVerifiedActive.mockResolvedValue(subscribers(10_000));

    const handlers = buildJobHandlers();
    await handlers[Jobs.NewsletterBroadcast]({ subject: 'S', html: 'H' });

    // Eski kod burada 10.000 sıralı await yapardı.
    expect(addSpy).toHaveBeenCalledTimes(100);
  });

  it('batch handler.ı alıcı başına EmailSend job.ı üretir (sınırlı döngü)', async () => {
    const handlers = buildJobHandlers();
    await handlers[Jobs.NewsletterBroadcastBatch]({
      subject: 'Konu',
      html: '<p>içerik</p>',
      text: 'içerik',
      recipients: [
        { id: 's1', email: 'a@b.com' },
        { id: 's2', email: 'c@d.com' },
      ],
      batchIndex: 0,
      batchCount: 1,
    });

    expect(addSpy).toHaveBeenCalledTimes(2);
    expect(addSpy.mock.calls[0]![0]).toMatchObject({
      name: Jobs.EmailSend,
      data: { to: 'a@b.com', subject: 'Konu' },
      attempts: 3,
    });
  });

  it('batch handler.ı boş alıcı listesinde uyarır ve iş üretmez', async () => {
    const handlers = buildJobHandlers();
    await handlers[Jobs.NewsletterBroadcastBatch]({
      subject: 'S',
      html: 'H',
      recipients: [],
      batchIndex: 0,
      batchCount: 1,
    });

    expect(addSpy).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('boş alıcı'),
      expect.anything()
    );
  });

  it('batch handler.ı data undefined ise patlamaz', async () => {
    const handlers = buildJobHandlers();
    await expect(
      handlers[Jobs.NewsletterBroadcastBatch](undefined)
    ).resolves.toBeUndefined();
    expect(addSpy).not.toHaveBeenCalled();
  });
});

describe('Implementasyonu olmayan job.lar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('UNIMPLEMENTED_JOBS listesi belgelenmiş ve Jobs ile tutarlı', () => {
    for (const name of UNIMPLEMENTED_JOBS) {
      expect(ALL_JOB_NAMES).toContain(name);
    }
    expect([...UNIMPLEMENTED_JOBS].sort()).toEqual(
      [Jobs.ImageOptimize, Jobs.OrderExpire, Jobs.templateInstall].sort()
    );
  });

  it('sessizce düşmez — error seviyesinde loglar', async () => {
    const handlers = buildJobHandlers();

    for (const name of UNIMPLEMENTED_JOBS) {
      vi.mocked(logger.error).mockClear();
      await handlers[name]({ some: 'data' });
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('implementasyon yok'),
        expect.objectContaining({ job: name })
      );
    }
  });

  it('throw etmez (retry fırtınası çıkarmaz)', async () => {
    const handlers = buildJobHandlers();
    for (const name of UNIMPLEMENTED_JOBS) {
      await expect(handlers[name]({})).resolves.toBeUndefined();
    }
  });

  it('templateInstall enqueue EDİLİYOR ama worker.ı yok — bilinen eksiklik', () => {
    // templateService.installTemplate() bu job'ı kuyruğa ekliyor; kurulum
    // 'pending' kalıyor. Sessiz bir bug değil, belgelenmiş boşluk.
    expect(UNIMPLEMENTED_JOBS).toContain(Jobs.templateInstall);
  });
});

describe('Handler guard.ları — eksik parametre', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const cases: Array<[string, JobName, unknown, string]> = [
    ['AiBulkGenerate', Jobs.AiBulkGenerate, {}, 'AiBulkGenerate'],
    ['AiBulkRowRetry', Jobs.AiBulkRowRetry, { jobId: 'j1' }, 'AiBulkRowRetry'],
    ['AiBulkGenerateDeadLetter', Jobs.AiBulkGenerateDeadLetter, {}, 'AiBulkGenerateDeadLetter'],
    ['OrderPostCheckout', Jobs.OrderPostCheckout, {}, 'OrderPostCheckout'],
    ['BreachDeadlineReminder', Jobs.BreachDeadlineReminder, {}, 'BreachDeadlineReminder'],
    ['AutoSubmitBreachToVerbis', Jobs.AutoSubmitBreachToVerbis, {}, 'AutoSubmitBreachToVerbis'],
    ['TemplateDemoDeploy', Jobs.TemplateDemoDeploy, { templateSlug: 'x' }, 'TemplateDemoDeploy'],
    ['ComplianceScan', Jobs.ComplianceScan, {}, 'ComplianceScan'],
  ];

  for (const [label, jobName, data, expectedLog] of cases) {
    it(`${label} eksik parametre ile çağrılırsa loglar ve servisi ÇAĞIRMAZ`, async () => {
      const handlers = buildJobHandlers();
      await expect(handlers[jobName](data)).resolves.toBeUndefined();
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining(expectedLog),
        expect.anything()
      );
    });
  }

  it('eksik parametrede ilgili servis fonksiyonu hiç çağrılmaz', async () => {
    const handlers = buildJobHandlers();
    await handlers[Jobs.AiBulkGenerate]({});
    await handlers[Jobs.OrderPostCheckout]({});
    await handlers[Jobs.ComplianceScan]({});

    expect(mockProcessBulkGeneration).not.toHaveBeenCalled();
    expect(mockRunPostCheckout).not.toHaveBeenCalled();
    expect(mockRunComplianceScan).not.toHaveBeenCalled();
  });

  it('AiBrandVoiceTrain no-op stub olarak çalışır', async () => {
    const handlers = buildJobHandlers();
    await expect(
      handlers[Jobs.AiBrandVoiceTrain]({ brandVoiceId: 'bv1' })
    ).resolves.toBeUndefined();
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining('AiBrandVoiceTrain'),
      expect.objectContaining({ brandVoiceId: 'bv1' })
    );
  });
});
