/**
 * Compliance Continuous Monitoring Scheduler — Phase 4 C.4
 *
 * ComplianceSite'lar için "next scan at" hesabı, due scan tespiti ve
 * kuyruğa ekleme yardımcıları. queueHandlers.ts içindeki runComplianceMonitor
 * job'ı bu fonksiyonları kullanır; ayrıca API route'ları (start/stop
 * monitoring) de scheduleNextScan + pauseForSite üzerinden tetiklenir.
 *
 * Mimari:
 *   - scheduleScan(site): site.scanInterval'e göre nextScanAt hesapla (DB yazmaz)
 *   - getDueScans(now, limit): nextScanAt <= now + status filter olan siteleri getir
 *   - runScheduledScans(now, limit): due scan'leri kuyruğa ekle (atomic, skip edilenleri raporla)
 *   - pauseMonitoring(siteId): site.status'u 'paused' olarak işaretle, nextScanAt temizle
 *   - resumeMonitoring(siteId): site.status'u 'pending' yap, nextScanAt'i yeniden hesapla
 *
 * Pattern:
 *   - src/lib/queue.ts (Jobs.ComplianceScan + queue.add)
 *   - src/lib/audit.ts (logAudit)
 *   - src/lib/logger.ts (logger)
 *   - src/modules/compliance/service.ts (startScan)
 */

import { Prisma } from '@prisma/client';

import { prisma } from '@/lib/prisma';
import { Jobs, queue } from '@/lib/queue';
import { logAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';

import {
  scanIntervalToMs,
  type ScanInterval,
} from './schemas';

// ============================================================================
// Constants
// ============================================================================

/** Bir tick'te kuyruğa eklenebilecek maksimum site sayısı (memory pressure). */
const DEFAULT_TICK_LIMIT = 50;

// ============================================================================
// scheduleScan (pure) — site verisi → nextScanAt hesapla
// ============================================================================

export interface ScheduleScanArgs {
  /** Mevcut "nextScanAt" değeri (varsa). İlk scan için Date.now() kullanılır. */
  fromTime?: Date;
  /** Tarama periyodu. */
  scanInterval: ScanInterval;
}

export interface ScheduleScanResult {
  nextScanAt: Date;
  intervalMs: number;
}

/**
 * Tarama periyoduna göre bir sonraki scan zamanını hesaplar (pure function,
 * DB'ye dokunmaz). Service katmanı ya da queue handler tarafından çağrılır.
 *
 * Daily: +1 gün, Weekly: +7 gün, Monthly: +30 gün.
 * Sub-day precision için now() ile hesaplanır; aynı gün birden fazla scan
 * istemeyen rate-limiting katmanı queue.add'de uygulanır.
 */
export function scheduleScan(args: ScheduleScanArgs): ScheduleScanResult {
  const from = args.fromTime ?? new Date();
  const intervalMs = scanIntervalToMs(args.scanInterval);
  const nextScanAt = new Date(from.getTime() + intervalMs);
  return { nextScanAt, intervalMs };
}

// ============================================================================
// getDueScans
// ============================================================================

export interface GetDueScansOptions {
  /** Şu anki zaman (testler için parametre). Default new Date(). */
  now?: Date;
  /** Max site sayısı (memory pressure). Default 50. */
  limit?: number;
}

/**
 * nextScanAt <= now olan ve status'u monitoring uygun olan ComplianceSite'ları
 * döner. 'scanning' (zaten job var), 'paused' (monitoring durmuş) veya
 * 'pending' (henüz başlatılmamış — manuel scan gerekir) durumları hariç.
 */
export async function getDueScans(options: GetDueScansOptions = {}): Promise<
  Array<{
    id: string;
    workspaceId: string;
    domain: string;
    scanInterval: ScanInterval;
    nextScanAt: Date;
  }>
> {
  const now = options.now ?? new Date();
  const limit = Math.max(1, Math.min(200, options.limit ?? DEFAULT_TICK_LIMIT));

  const sites = await prisma.complianceSite.findMany({
    where: {
      nextScanAt: { lte: now, not: null },
      // 'scanning' zaten bir job'a sahip; 'paused' monitoring durmuş; 'pending' hiç başlamamış
      status: { in: ['warning', 'critical', 'compliant'] },
    },
    orderBy: { nextScanAt: 'asc' },
    take: limit,
    select: {
      id: true,
      workspaceId: true,
      domain: true,
      scanInterval: true,
      nextScanAt: true,
    },
  });

  // nextScanAt filter null zaten var; ama TS için non-null assertion
  return sites
    .filter((s): s is typeof s & { nextScanAt: Date } => s.nextScanAt !== null)
    .map((s) => ({
      ...s,
      scanInterval: s.scanInterval as ScanInterval,
    }));
}

// ============================================================================
// runScheduledScans
// ============================================================================

export interface RunScheduledScansResult {
  queuedCount: number;
  skippedCount: number;
  errors: Array<{ siteId: string; reason: string }>;
}

/**
 * getDueScans ile bulunan siteler için yeni CookieScan oluşturup
 * ComplianceScan job'ı kuyruğa ekler. Tek bir site hata verse bile diğerleri
 * etkilenmez. queueHandlers.runComplianceMonitor bu fonksiyonu çağırır.
 *
 * Idempotency:
 *   - Her site için zaten 'running' scan varsa skip
 *   - CookieScan 'running' olarak işaretlenir → atomic check
 *   - ComplianceSite.status 'scanning' yapılır (dashboard feedback)
 */
export async function runScheduledScans(
  options: GetDueScansOptions = {}
): Promise<RunScheduledScansResult> {
  const result: RunScheduledScansResult = {
    queuedCount: 0,
    skippedCount: 0,
    errors: [],
  };

  const dueSites = await getDueScans(options);
  if (dueSites.length === 0) {
    logger.debug('[compliance-scheduler] No due scans');
    return result;
  }

  logger.info('[compliance-scheduler] Due scans bulundu', {
    count: dueSites.length,
  });

  for (const site of dueSites) {
    try {
      // Zaten çalışan scan var mı? (race guard)
      const running = await prisma.cookieScan.findFirst({
        where: { siteId: site.id, status: 'running' },
        select: { id: true },
      });
      if (running) {
        result.skippedCount++;
        logger.debug('[compliance-scheduler] Site zaten taranıyor', {
          siteId: site.id,
          runningScanId: running.id,
        });
        continue;
      }

      const newScan = await prisma.cookieScan.create({
        data: {
          siteId: site.id,
          status: 'running',
          startedAt: new Date(),
        },
      });

      await prisma.complianceSite.update({
        where: { id: site.id },
        data: { status: 'scanning' },
      });

      await queue.add({
        id: `compliance-scan-${newScan.id}`,
        name: Jobs.ComplianceScan,
        data: { scanId: newScan.id, siteId: site.id },
        attempts: 2,
      });

      result.queuedCount++;

      await logAudit({
        action: 'AI_GENERATE',
        resource: 'CookieScan',
        resourceId: newScan.id,
        details: {
          trigger: 'scheduler',
          siteId: site.id,
          domain: site.domain,
          scanInterval: site.scanInterval,
        },
      });

      logger.info('[compliance-scheduler] Scan queued', {
        siteId: site.id,
        domain: site.domain,
        scanId: newScan.id,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      result.errors.push({ siteId: site.id, reason: message.slice(0, 200) });
      logger.error('[compliance-scheduler] Site queue hatası', {
        siteId: site.id,
        domain: site.domain,
        error: message,
      });
    }
  }

  return result;
}

// ============================================================================
// pauseMonitoring — monitor stop
// ============================================================================

export interface PauseMonitoringArgs {
  siteId: string;
  workspaceId: string;
  userId: string;
  userEmail?: string;
}

export interface PauseMonitoringResult {
  siteId: string;
  status: 'paused';
  pausedAt: Date;
}

/**
 * Continuous monitoring'i durdurur. nextScanAt null yapılır; status
 * 'paused' olur. İleride resumeMonitoring ile geri açılabilir.
 *
 * NOT: 'paused' status'u ComplianceSite.status enum'unda olmayan bir değer —
 * şemayı zorlamamak için burada raw string olarak yazıyoruz (Prisma String).
 */
export async function pauseMonitoring(args: PauseMonitoringArgs): Promise<PauseMonitoringResult> {
  const site = await prisma.complianceSite.findFirst({
    where: { id: args.siteId, workspaceId: args.workspaceId },
    select: { id: true, domain: true, status: true },
  });
  if (!site) {
    const err = new Error('Site bulunamadı');
    (err as Error & { code?: string }).code = 'SITE_NOT_FOUND';
    throw err;
  }

  const pausedAt = new Date();
  await prisma.complianceSite.update({
    where: { id: site.id },
    data: {
      status: 'paused',
      nextScanAt: null,
      notes: `${pausedAt.toISOString()} tarihinde monitoring durduruldu`,
    },
  });

  await logAudit({
    userId: args.userId,
    userEmail: args.userEmail,
    action: 'UPDATE',
    resource: 'ComplianceSite',
    resourceId: site.id,
    details: {
      action: 'pause_monitoring',
      previousStatus: site.status,
      newStatus: 'paused',
      pausedAt: pausedAt.toISOString(),
    },
  });

  logger.info('[compliance-scheduler] Monitoring paused', {
    siteId: site.id,
    domain: site.domain,
    userId: args.userId,
  });

  return {
    siteId: site.id,
    status: 'paused',
    pausedAt,
  };
}

// ============================================================================
// resumeMonitoring — monitor start
// ============================================================================

export interface ResumeMonitoringArgs {
  siteId: string;
  workspaceId: string;
  userId: string;
  userEmail?: string;
  /** İlk scan hemen tetiklensin mi? Default true (monitoring'i açınca bekleme yok). */
  triggerImmediateScan?: boolean;
}

export interface ResumeMonitoringResult {
  siteId: string;
  status: 'pending' | 'scanning';
  nextScanAt: Date;
  immediateScanId?: string;
}

/**
 * Continuous monitoring'i başlatır. Status 'pending' yapılır, nextScanAt
 * scanInterval'e göre hesaplanır. triggerImmediateScan=true ise yeni bir
 * CookieScan + queue job oluşturulur (hemen tarama başlar).
 */
export async function resumeMonitoring(
  args: ResumeMonitoringArgs
): Promise<ResumeMonitoringResult> {
  const triggerImmediate = args.triggerImmediateScan ?? true;

  const site = await prisma.complianceSite.findFirst({
    where: { id: args.siteId, workspaceId: args.workspaceId },
    select: { id: true, domain: true, scanInterval: true, status: true },
  });
  if (!site) {
    const err = new Error('Site bulunamadı');
    (err as Error & { code?: string }).code = 'SITE_NOT_FOUND';
    throw err;
  }

  const { nextScanAt } = scheduleScan({ scanInterval: site.scanInterval as ScanInterval });

  await prisma.complianceSite.update({
    where: { id: site.id },
    data: {
      status: 'pending',
      nextScanAt,
      notes: null,
    },
  });

  let immediateScanId: string | undefined;
  let newStatus: 'pending' | 'scanning' = 'pending';

  if (triggerImmediate) {
    // Zaten çalışan scan var mı?
    const running = await prisma.cookieScan.findFirst({
      where: { siteId: site.id, status: 'running' },
      select: { id: true },
    });
    if (!running) {
      const newScan = await prisma.cookieScan.create({
        data: {
          siteId: site.id,
          status: 'running',
          startedAt: new Date(),
        },
      });

      await prisma.complianceSite.update({
        where: { id: site.id },
        data: { status: 'scanning' },
      });

      await queue.add({
        id: `compliance-scan-${newScan.id}`,
        name: Jobs.ComplianceScan,
        data: { scanId: newScan.id, siteId: site.id },
        attempts: 2,
      });

      immediateScanId = newScan.id;
      newStatus = 'scanning';

      await logAudit({
        userId: args.userId,
        userEmail: args.userEmail,
        action: 'AI_GENERATE',
        resource: 'CookieScan',
        resourceId: newScan.id,
        details: {
          trigger: 'resume_monitoring',
          siteId: site.id,
          domain: site.domain,
        },
      });
    }
  }

  await logAudit({
    userId: args.userId,
    userEmail: args.userEmail,
    action: 'UPDATE',
    resource: 'ComplianceSite',
    resourceId: site.id,
    details: {
      action: 'resume_monitoring',
      previousStatus: site.status,
      newStatus,
      nextScanAt: nextScanAt.toISOString(),
      immediateScanId,
    },
  });

  logger.info('[compliance-scheduler] Monitoring resumed', {
    siteId: site.id,
    domain: site.domain,
    userId: args.userId,
    newStatus,
    immediateScanId,
  });

  return {
    siteId: site.id,
    status: newStatus,
    nextScanAt,
    immediateScanId,
  };
}

// ============================================================================
// ComplianceSite.status helper — paused dahil tüm monitoring-aware durumlar
// ============================================================================

/**
 * ComplianceSite.status'ın monitoring'de değerlendirilecek olup olmadığını
 * söyler. 'paused' → hayır; diğer aktif durumlar → evet. Dışarıdan
 * status enum'unu 'paused' ile genişletmek için yardımcı.
 */
export function isMonitoringActive(status: string): boolean {
  return ['pending', 'scanning', 'warning', 'critical', 'compliant'].includes(status);
}

// ============================================================================
// Type exports
// ============================================================================

export type { ScanInterval };
export { Jobs };
// Prisma re-export (service.ts'ten erişim için)
export { Prisma };