/**
 * Background Job Queue
 *
 * İki mod:
 *   1. BullMQ + Redis  — REDIS_URL tanımlıysa. Kalıcı, retry'lı, dağıtık.
 *   2. In-memory       — REDIS_URL yoksa. setTimeout tabanlı, process'e bağlı.
 *
 * In-memory mode PRODUCTION İÇİN DEĞİLDİR: process restart olursa bekleyen
 * job'lar kaybolur ve serverless (Vercel) ortamında response döndükten sonra
 * çalışması garanti değildir. Vercel'de gerçek queue için REDIS_URL şart.
 */

import { logger } from '@/lib/logger';

export interface Job {
  /** Idempotency / log takibi için benzersiz id */
  id: string;
  /** Handler seçiminde kullanılan job adı (bkz. Jobs) */
  name: string;
  data: unknown;
  /** Gecikme (ms) */
  delay?: number;
  /** Başarısızlıkta toplam deneme sayısı (BullMQ mode) */
  attempts?: number;
}

export type JobHandler = (data: any) => Promise<void>;

export interface Queue {
  /** Job'ı kuyruğa ekler. Handler yoksa uyarır ve düşürür. */
  add(job: Job): Promise<void>;
  /** Bir job adı için handler kaydeder. */
  register(name: string, handler: JobHandler): void;
  /** Kuyruğun hangi modda çalıştığı — teşhis ve test için. */
  readonly driver: 'bullmq' | 'memory';
  close(): Promise<void>;
}

/** Job adları — string literal yazmak yerine bunları kullan. */
export const Jobs = {
  MonitorCheck: 'monitor.check',
  NewsletterBroadcast: 'newsletter.broadcast',
  EmailSend: 'email.send',
  ImageOptimize: 'image.optimize',
  OrderExpire: 'order.expire',
} as const;

export type JobName = (typeof Jobs)[keyof typeof Jobs];

// --- In-memory driver -------------------------------------------------------

/**
 * setTimeout tabanlı queue. Redis gerektirmez; dev ve test için.
 * Retry'ı elle uygular (BullMQ'nun exponential backoff'unu taklit eder).
 */
export class InMemoryQueue implements Queue {
  readonly driver = 'memory' as const;

  private handlers = new Map<string, JobHandler>();
  /** Kapanışta temizlenebilmesi için bekleyen timer'lar */
  private timers = new Set<NodeJS.Timeout>();
  private closed = false;

  register(name: string, handler: JobHandler): void {
    this.handlers.set(name, handler);
  }

  async add(job: Job): Promise<void> {
    if (this.closed) {
      logger.warn('[queue] Kapalı kuyruğa job eklendi, düşürüldü', { job: job.name, id: job.id });
      return;
    }

    const handler = this.handlers.get(job.name);
    if (!handler) {
      logger.warn('[queue] Job için handler bulunamadı', { job: job.name, id: job.id });
      return;
    }

    const attempts = Math.max(1, job.attempts ?? 1);

    const timer = setTimeout(() => {
      this.timers.delete(timer);
      // Fire-and-forget: caller'ı bloklamaz, hata yukarı sızmaz.
      void this.runWithRetry(job, handler, attempts);
    }, job.delay ?? 0);

    // Bekleyen job process'in kapanmasını engellemesin (test/CLI takılmasını önler).
    timer.unref?.();
    this.timers.add(timer);
  }

  private async runWithRetry(job: Job, handler: JobHandler, attempts: number): Promise<void> {
    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        await handler(job.data);
        return;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        const isLast = attempt === attempts;
        logger.error('[queue] Job başarısız', {
          job: job.name,
          id: job.id,
          attempt,
          attempts,
          willRetry: !isLast,
          error: message,
        });
        if (isLast || this.closed) return;
        // Exponential backoff: 1s, 2s, 4s...
        await new Promise((r) => {
          const t = setTimeout(r, 1000 * 2 ** (attempt - 1));
          t.unref?.();
        });
      }
    }
  }

  async close(): Promise<void> {
    this.closed = true;
    for (const timer of this.timers) clearTimeout(timer);
    this.timers.clear();
    this.handlers.clear();
  }
}

// --- BullMQ driver ----------------------------------------------------------

const BULL_QUEUE_NAME = 'noktanyus-jobs';

/**
 * BullMQ tabanlı queue. Tüm job tipleri tek queue'da tutulur; ayırma
 * job.name üzerinden worker içinde yapılır.
 */
export class BullMQQueue implements Queue {
  readonly driver = 'bullmq' as const;

  private queue: any = null;
  private worker: any = null;
  private bull: any = null;
  private handlers = new Map<string, JobHandler>();
  private connection: { url: string };

  constructor(redisUrl: string) {
    this.connection = { url: redisUrl };
    // bullmq opsiyonel bir bağımlılık gibi ele alınır: yüklü değilse
    // constructor patlamaz, createQueue() in-memory'e düşer.
    // require() burada koşullu yükleme için kullanılır; standart bundler
    // dynamic import yerine bunu kabul eder.
    this.bull = require('bullmq');
    this.queue = new this.bull.Queue(BULL_QUEUE_NAME, {
      connection: this.connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: 100,
        removeOnFail: 500,
      },
    });
  }

  register(name: string, handler: JobHandler): void {
    this.handlers.set(name, handler);
    this.ensureWorker();
  }

  /** İlk handler kaydında worker'ı ayağa kaldırır (lazy). */
  private ensureWorker(): void {
    if (this.worker) return;

    this.worker = new this.bull.Worker(
      BULL_QUEUE_NAME,
      async (job: { name: string; data: unknown; id?: string }) => {
        const handler = this.handlers.get(job.name);
        if (!handler) {
          logger.warn('[queue] Job için handler bulunamadı', { job: job.name, id: job.id });
          return;
        }
        // Hata bilinçli olarak yukarı fırlatılır — BullMQ retry'ı tetiklesin.
        await handler(job.data);
      },
      { connection: this.connection, concurrency: 5 }
    );

    this.worker.on('failed', (job: any, err: Error) => {
      logger.error('[queue] Job başarısız', {
        job: job?.name,
        id: job?.id,
        attempt: job?.attemptsMade,
        error: err?.message,
      });
    });
  }

  async add(job: Job): Promise<void> {
    if (!this.queue) return;
    await this.queue.add(job.name, job.data, {
      jobId: job.id,
      delay: job.delay,
      attempts: job.attempts ?? 3,
    });
  }

  async close(): Promise<void> {
    await this.worker?.close();
    await this.queue?.close();
    this.worker = null;
    this.queue = null;
  }
}

// --- Factory ----------------------------------------------------------------

export function createQueue(): Queue {
  const redisUrl = process.env.REDIS_URL?.trim();

  if (!redisUrl) {
    logger.info('[queue] REDIS_URL tanımlı değil, in-memory queue kullanılıyor');
    return new InMemoryQueue();
  }

  try {
    const q = new BullMQQueue(redisUrl);
    logger.info('[queue] BullMQ + Redis queue aktif');
    return q;
  } catch (err) {
    // bullmq yüklü değil ya da bağlantı kurulamadı — servis çökmesin.
    logger.error('[queue] BullMQ başlatılamadı, in-memory queue kullanılıyor', {
      error: err instanceof Error ? err.message : String(err),
    });
    return new InMemoryQueue();
  }
}

/** Uygulama genelinde tek queue instance'ı. */
export const queue: Queue = createQueue();
