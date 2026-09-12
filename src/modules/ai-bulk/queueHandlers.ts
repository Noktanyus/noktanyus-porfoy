/**
 * AI Bulk Generation — Queue Handler Registrations (Phase 2 A.2 + L4)
 *
 * AiBulkGenerate job'ı için BullMQ/memory queue handler kaydeder.
 * service.ts içindeki processBulkGeneration'ı çağırır; hata fırlatırsa
 * queue driver'ı retry'ı tetikler (max attempts: 2).
 *
 * L4 ekleri:
 *   - AiBulkRowRetry: per-row backoff sonrası retry
 *   - AiBulkGenerateDeadLetter: DLQ notification handler
 *
 * registerQueueHandlers() içinde dinamik import edilir (circular dependency
 * önlemek için — service → queue → service döngüsünü kırar).
 */

import { Jobs, queue } from '@/lib/queue';
import { logger } from '@/lib/logger';

let registered = false;

export function registerAiBulkQueueHandlers(): void {
  if (registered) return;
  registered = true;

  queue.register(Jobs.AiBulkGenerate, async (data: { jobId: string; userId: string }) => {
    if (!data?.jobId) {
      logger.error('[ai-bulk] Handler called without jobId', { data });
      return;
    }
    // Dynamic import — circular dependency (service → queue → service) önleme
    const { processBulkGeneration } = await import('./service');
    const result = await processBulkGeneration(data.jobId);
    logger.info('[ai-bulk] Queue handler completed', {
      jobId: data.jobId,
      successful: result.successfulRows,
      failed: result.failedRows,
      skipped: result.skippedRows,
    });
  });

  // Brand Voice training job'ı için stub (Phase 2 A.1'de gelecek implementasyon)
  queue.register(Jobs.AiBrandVoiceTrain, async (data: { brandVoiceId: string }) => {
    logger.info('[ai-bulk] AiBrandVoiceTrain job received (no-op stub)', { data });
    // Phase 2 A.1 tamamlandığında brandVoiceService.trainModel(data.brandVoiceId) çağrılacak
  });

  // L4 — Per-row retry handler (backoff sonrası)
  queue.register(
    Jobs.AiBulkRowRetry,
    async (data: { jobId: string; rowIndex: number }) => {
      if (!data?.jobId || typeof data.rowIndex !== 'number') {
        logger.error('[ai-bulk] Row retry handler eksik parametre', { data });
        return;
      }
      const { processRowRetry } = await import('./service');
      const result = await processRowRetry(data.jobId, data.rowIndex);
      logger.info('[ai-bulk] Row retry completed', {
        jobId: data.jobId,
        rowIndex: data.rowIndex,
        status: result.status,
      });
    }
  );

  // L4 — Dead letter notification handler
  queue.register(
    Jobs.AiBulkGenerateDeadLetter,
    async (data: { jobId: string }) => {
      if (!data?.jobId) {
        logger.error('[ai-bulk] DLQ handler eksik jobId', { data });
        return;
      }
      const { processDeadLetterNotification } = await import('./service');
      const result = await processDeadLetterNotification(data.jobId);
      logger.info('[ai-bulk] DLQ notification completed', {
        jobId: data.jobId,
        emailSent: result.emailSent,
        deadLetterCount: result.deadLetterCount,
        csvUrl: result.csvUrl,
      });
    }
  );
}
