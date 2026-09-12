/**
 * Queue Service — job enqueue API'si.
 *
 * Servis katmanı doğrudan `queue.add` çağırmaz; buradaki tiplenmiş
 * yardımcıları kullanır. Handler kayıtları queueHandlers.ts içindedir.
 */

import { queue, Jobs } from '@/lib/queue';
import { registerQueueHandlers } from '@/lib/queueHandlers';
import { logger } from '@/lib/logger';

// Handler'lar ilk kullanımda bir kez kaydedilir (idempotent).
registerQueueHandlers();

export interface EmailJobData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface MonitorCheckJobData {
  monitorId: string;
}

export interface BroadcastJobData {
  subject: string;
  html: string;
  text?: string;
}

export interface AiBulkGenerateJobData {
  jobId: string;
  userId: string;
}

export interface OrderPostCheckoutJobData {
  orderId: string;
}

let counter = 0;
/** Çakışmayan job id üretir (BullMQ jobId olarak da kullanılır). */
function jobId(prefix: string): string {
  counter = (counter + 1) % 1_000_000;
  return `${prefix}_${Date.now()}_${counter}`;
}

export const queueService = {
  /** Tek bir monitör kontrolünü kuyruğa alır. */
  async scheduleMonitorCheck(monitorId: string, delayMs = 0): Promise<void> {
    return queue.add({
      id: jobId(`monitor_${monitorId}`),
      name: Jobs.MonitorCheck,
      data: { monitorId } satisfies MonitorCheckJobData,
      delay: delayMs,
      attempts: 2,
    });
  },

  /** Tek bir email gönderimini kuyruğa alır. */
  async sendEmail(data: EmailJobData): Promise<void> {
    return queue.add({
      id: jobId('email'),
      name: Jobs.EmailSend,
      data,
      attempts: 3,
    });
  },

  /**
   * Newsletter broadcast'ı kuyruğa alır. Abone listesi worker içinde
   * çözülür — böylece enqueue eden request hızlı döner.
   */
  async broadcastNewsletter(data: BroadcastJobData): Promise<void> {
    return queue.add({
      id: jobId('broadcast'),
      name: Jobs.NewsletterBroadcast,
      data,
      attempts: 1,
    });
  },

  /**
   * Toplu CSV AI üretimini kuyruğa alır (Phase 2 A.2).
   * Worker jobId üzerinden GenerationJob DB satırını çekip satır satır işler.
   */
  async scheduleBulkGeneration(data: AiBulkGenerateJobData): Promise<void> {
    return queue.add({
      id: `ai-bulk-${data.jobId}`,
      name: Jobs.AiBulkGenerate,
      data,
      attempts: 2,
    });
  },

  /**
   * Ödeme sonrası yan etkileri kuyruğa alır (receipt e-postası, webhook,
   * notification, affiliate, loyalty, partner).
   *
   * `attempts: 1` — adımların çoğu idempotent değil, job seviyesinde retry
   * müşteriye çift e-posta demek. Gerekçe: commerce/postCheckout.ts.
   *
   * ENQUEUE HATASI YUTULUR: bu, Stripe webhook'unun ve iyzico callback'inin
   * kritik yolunda çağrılıyor. Redis erişilemezse sipariş yine PAID olmalı ve
   * webhook 200 dönmeli — aksi halde Stripe event'i tekrar teslim eder ve
   * sipariş iki kez işlenmeye çalışılır.
   */
  async enqueueOrderPostCheckout(data: OrderPostCheckoutJobData): Promise<void> {
    try {
      await queue.add({
        id: `order-post-checkout-${data.orderId}`,
        name: Jobs.OrderPostCheckout,
        data,
        attempts: 1,
      });
    } catch (err) {
      logger.error('[queueService] OrderPostCheckout kuyruğa eklenemedi', {
        orderId: data.orderId,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  },

  /** Aktif driver — teşhis endpoint'leri ve testler için. */
  get driver(): 'bullmq' | 'memory' {
    return queue.driver;
  },
};
