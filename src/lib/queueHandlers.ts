/**
 * Queue Handler Kayıtları — TEK KAYNAK
 *
 * Bu dosya `Jobs` içindeki HER job adı için bir handler tanımlar. Tip
 * `Record<JobName, JobHandler>` olduğu için `Jobs`a yeni bir job eklenip
 * buraya handler yazılmazsa DERLEME HATASI alınır. Amaç: eskiden olduğu gibi
 * job'ın sessizce "handler bulunamadı" uyarısıyla düşmesini engellemek.
 *
 * Servis modülleri DİNAMİK import ile çekilir: servisler kendileri queue'yu
 * import ediyor, statik import döngü (circular dependency) oluştururdu.
 *
 * MODÜL İÇİ REGISTRAR'LAR
 * -----------------------
 * `src/modules/ai-bulk/queueHandlers.ts` ve `src/modules/compliance/queueHandlers.ts`
 * içinde `registerAiBulkQueueHandlers()` / `registerComplianceQueueHandlers()`
 * fonksiyonları var ama HİÇBİR YERDEN ÇAĞRILMIYORDU; bu merkezi dosya da onların
 * job'larının yalnızca bir kısmını kaydediyordu. Sonuç: AiBulkRowRetry,
 * AiBulkGenerateDeadLetter ve tüm breach job'ları için handler yoktu ve bu
 * job'lar sessizce düşüyordu. Artık kayıt tek yerden yapılır ve handler'lar
 * o modüllerin servis fonksiyonlarına delege eder (aynı davranış, tek kayıt
 * noktası). Modül içi registrar'lar dokunulmadan bırakıldı; onlar da çağrılsa
 * `Map.set` üzerine yazdığı için çift kayıt zararsızdır.
 */

import { queue, Jobs, type JobName, type JobHandler, type Queue } from '@/lib/queue';
import { logger } from '@/lib/logger';

/**
 * Newsletter fan-out parça boyutu.
 *
 * Eskiden broadcast handler'ı TÜM abone listesini tek job içinde `for` döngüsüyle
 * tek tek `await queue.add(...)` ediyordu. 50k abonede bu, tek job içinde 50k
 * sıralı await demek: job dakikalarca sürer, ortasında hata alırsa baştan
 * başlar ve bir kısmına iki kez mail gider. Artık liste parçalara bölünür;
 * her parça kendi job'ı olur (bağımsız retry) ve döngü uzunluğu sabittir.
 */
export const BROADCAST_BATCH_SIZE = 100;

/** Diziyi sabit boyutlu parçalara böler. */
export function chunk<T>(items: readonly T[], size: number): T[][] {
  if (size < 1) throw new Error('chunk size >= 1 olmalı');
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

export interface BroadcastBatchData {
  subject: string;
  html: string;
  text?: string;
  recipients: Array<{ id: string; email: string }>;
  batchIndex: number;
  batchCount: number;
}

/**
 * Henüz implementasyonu OLMAYAN job'lar.
 *
 * Bunlar için `Jobs` sabiti ve (bazılarında) enqueue çağrısı var ama iş mantığı
 * yok. Burada bilinçli olarak "gürültülü no-op" handler'a bağlanırlar: job
 * düşerken sessiz kalmak yerine net bir hata logu bırakır. Boşluğu gizlemek
 * yerine görünür kılmak için liste export edilir ve testte doğrulanır
 * (bkz. queueHandlers.test.ts).
 *
 * - ImageOptimize : hiçbir yerden enqueue edilmiyor, worker'ı da yok.
 * - OrderExpire   : hiçbir yerden enqueue edilmiyor; otomatik sipariş iptali
 *                   bir ürün kararı, burada varsayılmıyor.
 * - templateInstall: `templateService.installTemplate()` bu job'ı ENQUEUE EDİYOR
 *                   ama kurulum worker'ı (Phase 3 B.2) henüz yazılmadı. Yani
 *                   kurulumlar 'pending' durumunda kalıyor — bu bilinen bir
 *                   eksiklik, sessiz bir bug değil.
 */
export const UNIMPLEMENTED_JOBS: readonly JobName[] = [
  Jobs.ImageOptimize,
  Jobs.OrderExpire,
  Jobs.templateInstall,
];

/** Gürültülü no-op: job'ı düşürür ama sebebini açıkça loglar. */
function notImplemented(jobName: JobName): JobHandler {
  return async (data: unknown) => {
    logger.error('[queue] Job için implementasyon yok, düşürüldü', {
      job: jobName,
      data,
    });
  };
}

/**
 * Tüm job handler'larını döner. Saf fonksiyon — yan etkisi yok, bu yüzden
 * testlerde queue'ya kaydetmeden tek tek çağrılabilir.
 */
export function buildJobHandlers(): Record<JobName, JobHandler> {
  return {
    // --- Email gönderimi ---
    [Jobs.EmailSend]: async (data: {
      to: string;
      subject: string;
      html: string;
      text?: string;
    }) => {
      const { sendEmail } = await import('@/lib/email');
      const result = await sendEmail(data);
      // sendEmail hata fırlatmaz, {success:false} döner — retry için fırlat.
      if (!result.success) {
        throw new Error(result.error ?? 'Email gönderimi başarısız');
      }
    },

    // --- Monitör kontrolü ---
    [Jobs.MonitorCheck]: async (data: { monitorId: string }) => {
      const { monitoringService } = await import('@/modules/monitoring/service');
      await monitoringService.processMonitorCheck(data.monitorId);
    },

    // --- Newsletter broadcast (parçalara böler, mail GÖNDERMEZ) ---
    [Jobs.NewsletterBroadcast]: async (data: {
      subject: string;
      html: string;
      text?: string;
    }) => {
      const { newsletterRepository } = await import('@/modules/newsletter/repository');
      const subscribers = await newsletterRepository.findVerifiedActive();

      const batches = chunk(
        subscribers.map((s) => ({ id: s.id, email: s.email })),
        BROADCAST_BATCH_SIZE
      );

      // Döngü uzunluğu abone sayısıyla değil, parça sayısıyla ölçeklenir.
      for (let i = 0; i < batches.length; i++) {
        await queue.add({
          id: `broadcast_batch_${Date.now()}_${i}`,
          name: Jobs.NewsletterBroadcastBatch,
          data: {
            subject: data.subject,
            html: data.html,
            text: data.text,
            recipients: batches[i]!,
            batchIndex: i,
            batchCount: batches.length,
          } satisfies BroadcastBatchData,
          attempts: 2,
        });
      }

      logger.info('[queue] Newsletter broadcast parçalandı', {
        total: subscribers.length,
        batches: batches.length,
        batchSize: BROADCAST_BATCH_SIZE,
      });
    },

    // --- Newsletter tek parça (en fazla BROADCAST_BATCH_SIZE alıcı) ---
    [Jobs.NewsletterBroadcastBatch]: async (data: BroadcastBatchData) => {
      const recipients = data?.recipients ?? [];
      if (!recipients.length) {
        logger.warn('[queue] Newsletter batch boş alıcı listesiyle geldi', {
          batchIndex: data?.batchIndex,
        });
        return;
      }

      // Alıcı başına ayrı EmailSend job'ı: tek adresin SMTP hatası diğerlerini
      // etkilemez ve retry e-posta bazında olur (eski davranış korunur).
      for (const recipient of recipients) {
        await queue.add({
          id: `email_${recipient.id}_${data.batchIndex}`,
          name: Jobs.EmailSend,
          data: {
            to: recipient.email,
            subject: data.subject,
            html: data.html,
            text: data.text,
          },
          attempts: 3,
        });
      }

      logger.info('[queue] Newsletter batch fan-out', {
        batchIndex: data.batchIndex,
        batchCount: data.batchCount,
        recipients: recipients.length,
      });
    },

    // --- Ödeme sonrası yan etkiler ---
    [Jobs.OrderPostCheckout]: async (data: { orderId: string }) => {
      if (!data?.orderId) {
        logger.error('[queue] OrderPostCheckout orderId olmadan çağrıldı', { data });
        return;
      }
      const { runPostCheckoutSideEffects } = await import('@/modules/commerce/postCheckout');
      await runPostCheckoutSideEffects(data.orderId);
    },

    // --- AI Bulk Generation (Phase 2 A.2) ---
    [Jobs.AiBulkGenerate]: async (data: { jobId: string; userId: string }) => {
      if (!data?.jobId) {
        logger.error('[queue] AiBulkGenerate jobId olmadan çağrıldı', { data });
        return;
      }
      const { processBulkGeneration } = await import('@/modules/ai-bulk/service');
      const result = await processBulkGeneration(data.jobId);
      logger.info('[queue] AiBulkGenerate completed', {
        jobId: data.jobId,
        successful: result.successfulRows,
        failed: result.failedRows,
        skipped: result.skippedRows,
      });
    },

    // --- L4 — Per-row AI Bulk retry ---
    [Jobs.AiBulkRowRetry]: async (data: { jobId: string; rowIndex: number }) => {
      if (!data?.jobId || typeof data.rowIndex !== 'number') {
        logger.error('[queue] AiBulkRowRetry eksik parametre', { data });
        return;
      }
      const { processRowRetry } = await import('@/modules/ai-bulk/service');
      const result = await processRowRetry(data.jobId, data.rowIndex);
      logger.info('[queue] AiBulkRowRetry completed', {
        jobId: data.jobId,
        rowIndex: data.rowIndex,
        status: result.status,
      });
    },

    // --- L4 — AI Bulk Dead Letter Queue ---
    [Jobs.AiBulkGenerateDeadLetter]: async (data: { jobId: string }) => {
      if (!data?.jobId) {
        logger.error('[queue] AiBulkGenerateDeadLetter eksik jobId', { data });
        return;
      }
      const { processDeadLetterNotification } = await import('@/modules/ai-bulk/service');
      const result = await processDeadLetterNotification(data.jobId);
      logger.info('[queue] AiBulkGenerateDeadLetter completed', {
        jobId: data.jobId,
        emailSent: result.emailSent,
        deadLetterCount: result.deadLetterCount,
      });
    },

    // --- AI Brand Voice Training (Phase 2 A.1 stub) ---
    [Jobs.AiBrandVoiceTrain]: async (data: { brandVoiceId: string }) => {
      logger.info('[queue] AiBrandVoiceTrain job received (no-op stub)', {
        brandVoiceId: data?.brandVoiceId,
      });
      // Phase 2 A.1 tamamlandığında brandVoiceService.trainModel çağrılacak.
    },

    // --- Template Marketplace kurulumu (worker Phase 3 B.2'de) ---
    [Jobs.templateInstall]: notImplemented(Jobs.templateInstall),

    // --- Template Demo Deploy (Phase 3 B.6) ---
    [Jobs.TemplateDemoDeploy]: async (data: {
      templateSlug: string;
      licenseKey: string;
      subdomain: string;
    }) => {
      if (!data?.licenseKey || !data?.subdomain || !data?.templateSlug) {
        logger.error('[queue] TemplateDemoDeploy eksik data', { data });
        return;
      }
      const { demoService } = await import('@/modules/marketplace/demoService');
      try {
        const result = await demoService.deploy({
          licenseKey: data.licenseKey,
          subdomain: data.subdomain,
        });
        logger.info('[queue] TemplateDemoDeploy basladi', {
          installationId: result.installationId,
          deploymentUrl: result.deploymentUrl,
        });
      } catch (err) {
        logger.error('[queue] TemplateDemoDeploy basarisiz', {
          templateSlug: data.templateSlug,
          error: err instanceof Error ? err.message : String(err),
        });
        throw err; // retry icin tekrar firlat
      }
    },

    // --- KVKK/GDPR Compliance Scan (Phase 4 C.2) ---
    [Jobs.ComplianceScan]: async (data: { scanId: string; siteId: string }) => {
      if (!data?.scanId) {
        logger.error('[queue] ComplianceScan eksik scanId', { data });
        return;
      }
      const { runComplianceScan } = await import('@/modules/compliance/queueHandlers');
      try {
        const result = await runComplianceScan(data.scanId);
        logger.info('[queue] ComplianceScan tamamlandi', {
          scanId: data.scanId,
          siteId: data.siteId,
          score: result.score,
        });
      } catch (err) {
        logger.error('[queue] ComplianceScan basarisiz', {
          scanId: data.scanId,
          error: err instanceof Error ? err.message : String(err),
        });
        throw err; // retry icin tekrar firlat
      }
    },

    // --- Compliance Monitor (Phase 4 C.4) ---
    [Jobs.ComplianceMonitor]: async (data: { triggeredAt?: string } | undefined) => {
      const { runScheduledScans } = await import('@/modules/compliance/scheduler');
      try {
        const result = await runScheduledScans();
        logger.info('[queue] ComplianceMonitor tamamlandi', {
          queued: result.queuedCount,
          skipped: result.skippedCount,
          errors: result.errors.length,
          triggeredAt: data?.triggeredAt,
        });
      } catch (err) {
        logger.error('[queue] ComplianceMonitor basarisiz', {
          error: err instanceof Error ? err.message : String(err),
        });
        throw err;
      }
    },

    // --- L8 — KVKK breach deadline hatırlatma ---
    [Jobs.BreachDeadlineReminder]: async (data: { breachId: string }) => {
      if (!data?.breachId) {
        logger.error('[queue] BreachDeadlineReminder eksik breachId', { data });
        return;
      }
      const { notifyAffectedUsers } = await import('@/modules/compliance/breachDetector');
      const { prisma } = await import('@/lib/prisma');
      const breach = await prisma.dataBreachIncident.findUnique({
        where: { id: data.breachId },
        select: { workspaceId: true },
      });
      if (!breach) {
        logger.warn('[queue] BreachDeadlineReminder: breach bulunamadı', {
          breachId: data.breachId,
        });
        return;
      }
      await notifyAffectedUsers(breach.workspaceId, data.breachId);
    },

    // --- L8 — 60. saatte otomatik VERBİS escalation ---
    [Jobs.AutoSubmitBreachToVerbis]: async (data: { breachId: string }) => {
      if (!data?.breachId) {
        logger.error('[queue] AutoSubmitBreachToVerbis eksik breachId', { data });
        return;
      }
      const { maybeAutoSubmitToVerbis } = await import('@/modules/compliance/breachDetector');
      await maybeAutoSubmitToVerbis(data.breachId);
    },

    // --- L8 — Günlük breach deadline cron ---
    [Jobs.BreachDeadlineCron]: async () => {
      const { processCheckBreaches } = await import('@/modules/compliance/breachDetector');
      await processCheckBreaches();
    },

    // --- Implementasyonu olmayanlar (bkz. UNIMPLEMENTED_JOBS) ---
    [Jobs.ImageOptimize]: notImplemented(Jobs.ImageOptimize),
    [Jobs.OrderExpire]: notImplemented(Jobs.OrderExpire),
  };
}

/** Aynı queue instance'ına iki kez kayıt yapılmasını engeller. */
const registeredTargets = new WeakSet<Queue>();

/**
 * Handler'ları verilen queue'ya kaydeder. Varsayılan hedef uygulama
 * singleton'ıdır. Tekrar çağırmak güvenlidir (idempotent).
 *
 * `target` parametresi testler için: gerçek singleton'a dokunmadan izole bir
 * `InMemoryQueue` üzerinde dispatch/retry doğrulanabilir.
 */
export function registerQueueHandlers(target: Queue = queue): void {
  if (registeredTargets.has(target)) return;
  registeredTargets.add(target);

  const handlers = buildJobHandlers();
  for (const [name, handler] of Object.entries(handlers)) {
    target.register(name, handler);
  }
}
