/**
 * Compliance Queue Handlers — Phase 4 C.2 / C.4
 *
 * İki BullMQ handler:
 *   1. runComplianceScan(scanId): Playwright ile site crawl, sonuçları
 *      CookieScan tablosuna yaz, ComplianceSite.status/complianceScore
 *      güncelle, bir sonraki scan zamanını ayarla.
 *   2. runComplianceMonitor(): nextScanAt dolmuş siteleri bulup
 *      ComplianceScan job'ı kuyruğa ekler.
 *
 * Pattern reuse:
 *   - src/modules/ai-bulk/queueHandlers.ts (queue handler dosya yapısı)
 *   - src/lib/queue.ts (Jobs, queue.add)
 *   - src/lib/logger.ts (logger)
 *   - src/lib/prisma.ts (PrismaClient)
 *
 * Hata davranışı:
 *   - runComplianceScan: hata fırlatır → BullMQ retry tetikler. CookieScan
 *     'failed' olarak işaretlenir (ComplianceSite durumu korunur).
 *   - runComplianceMonitor: tek bir site için hata olsa bile diğerlerini
 *     etkilemez, tüm liste döner.
 */

import { Prisma } from '@prisma/client';

import { prisma } from '@/lib/prisma';
import { Jobs, queue } from '@/lib/queue';
import { logger } from '@/lib/logger';
import { logAudit } from '@/lib/audit';

import { scanSite } from './scanner';
import {
  ScanResultSchema,
  type SiteStatus,
  type ScanInterval,
  scanIntervalToMs,
} from './schemas';

// ============================================================================
// runComplianceScan
// ============================================================================

export interface RunComplianceScanResult {
  scanId: string;
  siteId: string;
  status: 'completed' | 'failed';
  score?: number;
  cookiesCount: number;
  trackingScriptsCount: number;
  formsCount: number;
  threatsCount: number;
  durationMs: number;
  errorMessage?: string;
}

/**
 * ComplianceScan job handler. Playwright ile site crawl, sonuçları DB'ye yaz.
 * Hata durumunda CookieScan 'failed' işaretlenip exception throw edilir
 * (BullMQ retry için).
 */
export async function runComplianceScan(scanId: string): Promise<RunComplianceScanResult> {
  // Scan + site lookup (workspace filtresi yok — worker global scope)
  const scan = await prisma.cookieScan.findUnique({
    where: { id: scanId },
    include: {
      site: {
        select: {
          id: true,
          domain: true,
          workspaceId: true,
          scanInterval: true,
          status: true,
        },
      },
    },
  });

  if (!scan) {
    throw new Error(`CookieScan bulunamadı: ${scanId}`);
  }

  if (scan.status === 'completed') {
    logger.warn('[compliance] Scan zaten tamamlanmış, atlanıyor', {
      scanId,
      siteId: scan.siteId,
    });
    return {
      scanId,
      siteId: scan.siteId,
      status: 'completed',
      cookiesCount: 0,
      trackingScriptsCount: 0,
      formsCount: 0,
      threatsCount: 0,
      durationMs: 0,
    };
  }

  const { site } = scan;
  logger.info('[compliance] Scan başlıyor', {
    scanId,
    siteId: site.id,
    domain: site.domain,
  });

  let result: RunComplianceScanResult;

  try {
    // Playwright crawl
    const scanStartedAt = Date.now();
    const { scan: scanResult } = await scanSite(site.domain, {
      timeoutMs: 30_000,
      maxPages: 5,
    });
    const totalDurationMs = Date.now() - scanStartedAt;

    // DB güncelle (atomic — scan + site tek transaction)
    await prisma.$transaction(async (tx) => {
      await tx.cookieScan.update({
        where: { id: scanId },
        data: {
          status: 'completed',
          completedAt: new Date(),
          durationMs: totalDurationMs,
          pagesScanned: scanResult.pagesScanned,
          cookies: scanResult.cookies as unknown as Prisma.InputJsonValue,
          trackingScripts: scanResult.trackingScripts as unknown as Prisma.InputJsonValue,
          forms: scanResult.forms as unknown as Prisma.InputJsonValue,
          threats: scanResult.threats as unknown as Prisma.InputJsonValue,
          score: scanResult.score,
        },
      });

      // Site status'u score'a göre güncelle
      const newSiteStatus = deriveSiteStatus(scanResult.score, scanResult.threats.length);
      const nextScanAt = new Date(
        Date.now() + scanIntervalToMs(site.scanInterval as ScanInterval)
      );

      await tx.complianceSite.update({
        where: { id: site.id },
        data: {
          status: newSiteStatus,
          complianceScore: scanResult.score,
          lastScanAt: new Date(),
          nextScanAt,
        },
      });
    });

    // Audit log (best-effort)
    await logAudit({
      action: 'AI_GENERATE', // Uygun action tipi — yeni audit tipi eklemek yerine mevcut
      resource: 'CookieScan',
      resourceId: scanId,
      details: {
        siteId: site.id,
        domain: site.domain,
        score: scanResult.score,
        threatsCount: scanResult.threats.length,
        durationMs: totalDurationMs,
      },
    });

    logger.info('[compliance] Scan tamamlandı', {
      scanId,
      siteId: site.id,
      domain: site.domain,
      score: scanResult.score,
      threats: scanResult.threats.length,
      cookies: scanResult.cookies.length,
      durationMs: totalDurationMs,
    });

    result = {
      scanId,
      siteId: site.id,
      status: 'completed',
      score: scanResult.score,
      cookiesCount: scanResult.cookies.length,
      trackingScriptsCount: scanResult.trackingScripts.length,
      formsCount: scanResult.forms.length,
      threatsCount: scanResult.threats.length,
      durationMs: totalDurationMs,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    logger.error('[compliance] Scan başarısız', {
      scanId,
      siteId: site.id,
      domain: site.domain,
      error: errorMessage,
    });

    // DB'yi 'failed' olarak işaretle (site durumunu değiştirme — manual review gerek)
    try {
      await prisma.cookieScan.update({
        where: { id: scanId },
        data: {
          status: 'failed',
          completedAt: new Date(),
          errorMessage: errorMessage.slice(0, 1000),
        },
      });
      // Site'i tekrar 'pending' geri çek ki dashboard'da stuck kalmasın
      await prisma.complianceSite.update({
        where: { id: site.id },
        data: {
          status: 'warning',
        },
      });
    } catch (dbErr) {
      logger.error('[compliance] Failed DB update hatası', {
        scanId,
        error: dbErr,
      });
    }

    await logAudit({
      action: 'AI_GENERATE',
      resource: 'CookieScan',
      resourceId: scanId,
      details: {
        siteId: site.id,
        domain: site.domain,
        error: errorMessage.slice(0, 500),
      },
    });

    // Retry için throw
    throw err;
  }

  return result;
}

// ============================================================================
// runComplianceMonitor (Phase 4 C.4) — DEPRECATED, scheduler.ts'e taşındı
// ============================================================================

/**
 * @deprecated Phase 4 C.4 refactor — bu fonksiyon yerine scheduler.ts
 * içindeki runScheduledScans() kullanılır. queueHandlers.ts içindeki
 * ComplianceMonitor handler'ı doğrudan scheduler.runScheduledScans çağırır.
 *
 * Geriye dönük uyumluluk için export edildi; yeni kod import etmemeli.
 */
export async function runComplianceMonitor(): Promise<{
  queuedCount: number;
  skippedCount: number;
  errors: Array<{ siteId: string; reason: string }>;
}> {
  const { runScheduledScans } = await import('./scheduler');
  return runScheduledScans();
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Scan skoruna göre site status'unu belirler.
 */
function deriveSiteStatus(score: number, threatCount: number): SiteStatus {
  if (threatCount === 0 && score >= 90) return 'compliant';
  if (score >= 70) return 'warning';
  if (score >= 40) return 'critical';
  return 'critical';
}

// ============================================================================
// Self-registration helper
// ============================================================================

let registered = false;

/**
 * registerQueueHandlers() içinde çağrılmak üzere — merkezi handler dosyası
 * (src/lib/queueHandlers.ts) dinamik import ile bu fonksiyonu çağırır.
 * Burada yapılan sadece Jobs.ComplianceScan için queue.register yapmaktır;
 * runComplianceScan kendisi import edilerek doğrudan çalıştırılır.
 */
export function registerComplianceQueueHandlers(): void {
  if (registered) return;
  registered = true;

  queue.register(Jobs.ComplianceScan, async (data: { scanId: string; siteId: string }) => {
    if (!data?.scanId) {
      logger.error('[compliance] ComplianceScan handler eksik scanId', { data });
      return;
    }
    await runComplianceScan(data.scanId);
  });

  queue.register(Jobs.ComplianceMonitor, async () => {
    await runComplianceMonitor();
  });

  // L8 — KVKK breach deadline reminder handler.
  queue.register(
    Jobs.BreachDeadlineReminder,
    async (data: { breachId: string }) => {
      if (!data?.breachId) {
        logger.error('[compliance] Breach reminder eksik breachId', { data });
        return;
      }
      const { notifyAffectedUsers } = await import('./breachDetector');
      const { prisma: db } = await import('@/lib/prisma');
      const breach = await db.dataBreachIncident.findUnique({
        where: { id: data.breachId },
        select: { workspaceId: true },
      });
      if (!breach) return;
      await notifyAffectedUsers(breach.workspaceId, data.breachId);
    }
  );

  // L8 — Auto-submit breach to VERBİS (60h escalation).
  queue.register(
    Jobs.AutoSubmitBreachToVerbis,
    async (data: { breachId: string }) => {
      if (!data?.breachId) {
        logger.error('[compliance] AutoSubmit eksik breachId', { data });
        return;
      }
      const { maybeAutoSubmitToVerbis } = await import('./breachDetector');
      await maybeAutoSubmitToVerbis(data.breachId);
    }
  );

  // L8 — Daily deadline cron.
  queue.register(Jobs.BreachDeadlineCron, async () => {
    const { processCheckBreaches } = await import('./breachDetector');
    await processCheckBreaches();
  });

  logger.info('[compliance] Queue handlers registered');
}

// ScanResultSchema re-export — service.ts'in kullanımı için
export { ScanResultSchema };
