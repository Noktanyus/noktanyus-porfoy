/**
 * Queue Handler Kayıtları — mağaza + e-posta odaklı.
 * Kaldırılan ürün job'ları notImplemented stub.
 */

import { queue, Jobs, type JobName, type JobHandler, type Queue } from '@/lib/queue';
import { logger } from '@/lib/logger';

export const BROADCAST_BATCH_SIZE = 100;

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

export const UNIMPLEMENTED_JOBS: readonly JobName[] = [
  Jobs.ImageOptimize,
  Jobs.OrderExpire,
  Jobs.templateInstall,
  Jobs.MonitorCheck,
  Jobs.AiBulkGenerate,
  Jobs.AiBrandVoiceTrain,
  Jobs.AiBulkGenerateDeadLetter,
  Jobs.AiBulkRowRetry,
  Jobs.ComplianceScan,
  Jobs.ComplianceMonitor,
  Jobs.BreachDeadlineReminder,
  Jobs.AutoSubmitBreachToVerbis,
  Jobs.BreachDeadlineCron,
];

function notImplemented(jobName: JobName): JobHandler {
  return async (data: unknown) => {
    logger.error('[queue] Job için implementasyon yok, düşürüldü', {
      job: jobName,
      data,
    });
  };
}

export function buildJobHandlers(): Record<JobName, JobHandler> {
  return {
    [Jobs.EmailSend]: async (data: {
      to: string;
      subject: string;
      html: string;
      text?: string;
    }) => {
      const { sendEmail } = await import('@/lib/email');
      const result = await sendEmail(data);
      if (!result.success) {
        throw new Error(result.error ?? 'Email gönderimi başarısız');
      }
    },

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

    [Jobs.NewsletterBroadcastBatch]: async (data: BroadcastBatchData) => {
      const recipients = data?.recipients ?? [];
      if (!recipients.length) {
        logger.warn('[queue] Newsletter batch boş alıcı listesiyle geldi', {
          batchIndex: data?.batchIndex,
        });
        return;
      }

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

    [Jobs.OrderPostCheckout]: async (data: { orderId: string }) => {
      if (!data?.orderId) {
        logger.error('[queue] OrderPostCheckout orderId olmadan çağrıldı', { data });
        return;
      }
      const { runPostCheckoutSideEffects } = await import('@/modules/commerce/postCheckout');
      await runPostCheckoutSideEffects(data.orderId);
    },

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
      const result = await demoService.deploy({
        licenseKey: data.licenseKey,
        subdomain: data.subdomain,
      });
      logger.info('[queue] TemplateDemoDeploy basladi', {
        installationId: result.installationId,
        deploymentUrl: result.deploymentUrl,
      });
    },

    [Jobs.MonitorCheck]: notImplemented(Jobs.MonitorCheck),
    [Jobs.AiBulkGenerate]: notImplemented(Jobs.AiBulkGenerate),
    [Jobs.AiBrandVoiceTrain]: notImplemented(Jobs.AiBrandVoiceTrain),
    [Jobs.AiBulkGenerateDeadLetter]: notImplemented(Jobs.AiBulkGenerateDeadLetter),
    [Jobs.AiBulkRowRetry]: notImplemented(Jobs.AiBulkRowRetry),
    [Jobs.templateInstall]: notImplemented(Jobs.templateInstall),
    [Jobs.ComplianceScan]: notImplemented(Jobs.ComplianceScan),
    [Jobs.ComplianceMonitor]: notImplemented(Jobs.ComplianceMonitor),
    [Jobs.BreachDeadlineReminder]: notImplemented(Jobs.BreachDeadlineReminder),
    [Jobs.AutoSubmitBreachToVerbis]: notImplemented(Jobs.AutoSubmitBreachToVerbis),
    [Jobs.BreachDeadlineCron]: notImplemented(Jobs.BreachDeadlineCron),
    [Jobs.ImageOptimize]: notImplemented(Jobs.ImageOptimize),
    [Jobs.OrderExpire]: notImplemented(Jobs.OrderExpire),
  };
}

const registeredTargets = new WeakSet<Queue>();

export function registerQueueHandlers(target: Queue = queue): void {
  if (registeredTargets.has(target)) return;
  registeredTargets.add(target);

  const handlers = buildJobHandlers();
  for (const [name, handler] of Object.entries(handlers)) {
    target.register(name, handler);
  }
}
