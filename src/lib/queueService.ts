/**
 * Queue Service — job enqueue API'si.
 *
 * Servis katmanı doğrudan `queue.add` çağırmaz; buradaki tiplenmiş
 * yardımcıları kullanır. Handler kayıtları queueHandlers.ts içindedir.
 */

import { queue, Jobs } from '@/lib/queue';
import { registerQueueHandlers } from '@/lib/queueHandlers';

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

  /** Aktif driver — teşhis endpoint'leri ve testler için. */
  get driver(): 'bullmq' | 'memory' {
    return queue.driver;
  },
};
