/**
 * Queue Handler Kayıtları
 *
 * Her job adı için işleyiciyi buraya bağla. Servis modülleri DİNAMİK
 * import ile çekilir: monitoringService/newsletterService kendileri
 * queueService'i import ediyor, statik import döngü (circular dependency)
 * oluştururdu.
 */

import { queue, Jobs } from '@/lib/queue';
import { logger } from '@/lib/logger';

let registered = false;

/** Handler'ları bir kez kaydeder. Tekrar çağırmak güvenlidir. */
export function registerQueueHandlers(): void {
  if (registered) return;
  registered = true;

  // --- Email gönderimi ---
  queue.register(Jobs.EmailSend, async (data: { to: string; subject: string; html: string; text?: string }) => {
    const { sendEmail } = await import('@/lib/email');
    const result = await sendEmail(data);
    // sendEmail hata fırlatmaz, {success:false} döner — retry için fırlat.
    if (!result.success) {
      throw new Error(result.error ?? 'Email gönderimi başarısız');
    }
  });

  // --- Monitör kontrolü ---
  queue.register(Jobs.MonitorCheck, async (data: { monitorId: string }) => {
    const { monitoringService } = await import('@/modules/monitoring/service');
    await monitoringService.processMonitorCheck(data.monitorId);
  });

  // --- Newsletter broadcast (fan-out: abone başına email job'ı) ---
  queue.register(
    Jobs.NewsletterBroadcast,
    async (data: { subject: string; html: string; text?: string }) => {
      const { newsletterRepository } = await import('@/modules/newsletter/repository');
      const subscribers = await newsletterRepository.findVerifiedActive();

      for (const sub of subscribers) {
        // queueService yerine doğrudan queue — import döngüsünü kırar.
        await queue.add({
          id: `email_${sub.id}_${Date.now()}`,
          name: Jobs.EmailSend,
          data: { to: sub.email, subject: data.subject, html: data.html, text: data.text },
          attempts: 3,
        });
      }

      logger.info('[queue] Newsletter broadcast fan-out', { total: subscribers.length });
    }
  );
}
