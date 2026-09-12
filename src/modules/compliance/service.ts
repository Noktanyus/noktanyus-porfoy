/**
 * Compliance Service — Phase 4 C
 *
 * KVKK/GDPR Compliance Tracker iş mantığı katmanı:
 *   - addComplianceSite: domain kaydet (workspace bazlı)
 *   - listComplianceSites: workspace'in sitelerini listele
 *   - getComplianceSite: tekil site + son scan
 *   - deleteComplianceSite: site sil
 *   - startScan: ComplianceScan job oluşturup BullMQ'ya ekle
 *   - getLatestScan: site'ın en son tamamlanmış scan'i
 *   - listScans: scan history sayfalı
 *   - updateSiteStatus: manual override (warning/critical)
 *   - scheduleNextScan: bir sonraki scan zamanını hesapla
 *   - runComplianceAnalysis: ham crawl verisini analiz et (Phase 4 C.2)
 *   - finalizeScan: scan sonucunu DB'ye yaz, site status güncelle (Phase 4 C.2)
 *
 * Pattern reuse:
 *   - src/lib/prisma.ts        (PrismaClient singleton)
 *   - src/lib/queue.ts         (Jobs.ComplianceScan, queue.add)
 *   - src/lib/audit.ts         (logAudit)
 *   - src/lib/logger.ts        (logger)
 *   - src/modules/ai-bulk/service.ts (queue.add + audit pattern)
 *   - src/modules/compliance/cookieAnalyzer.ts   (classifyCookies)
 *   - src/modules/compliance/trackingDetector.ts (detectTrackingScripts)
 *   - src/modules/compliance/formAnalyzer.ts     (analyzeForms)
 *   - src/modules/compliance/threatRules.ts      (evaluateThreats, score)
 */

import { Prisma } from '@prisma/client';
import { z } from 'zod';

import { prisma } from '@/lib/prisma';
import { Jobs, queue } from '@/lib/queue';
import { logAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';

import { classifyCookies } from './cookieAnalyzer';
import { detectTrackingScripts } from './trackingDetector';
import { analyzeForms } from './formAnalyzer';
import { evaluateThreats, computeComplianceScore } from './threatRules';
import {
  AddSiteSchema,
  StartScanSchema,
  UpdateSiteStatusSchema,
  ScheduleNextScanSchema,
  ListSitesQuerySchema,
  ListScansQuerySchema,
  scanIntervalToMs,
  type AddSiteInput,
  type StartScanInput,
  type UpdateSiteStatusInput,
  type ScheduleNextScanInput,
  type ListSitesQuery,
  type ListScansQuery,
  type SiteStatus,
  type ScanInterval,
  type ScanResult,
  type CookieRecord,
  type TrackingScript,
  type FormRecord,
  type Threat,
} from './schemas';

// ============================================================================
// addComplianceSite
// ============================================================================

export interface AddSiteArgs {
  workspaceId: string;
  userId: string;
  userEmail?: string;
  input: AddSiteInput;
}

export async function addComplianceSite(args: AddSiteArgs) {
  const validated = AddSiteSchema.parse(args.input);

  // Workspace var mı?
  const workspace = await prisma.workspace.findUnique({
    where: { id: args.workspaceId },
    select: { id: true },
  });
  if (!workspace) {
    const err = new Error('Workspace bulunamadı');
    (err as Error & { code?: string }).code = 'WORKSPACE_NOT_FOUND';
    throw err;
  }

  // Domain unique — DB zaten constraint koyuyor; burada early-return için kontrol
  const existing = await prisma.complianceSite.findUnique({
    where: { domain: validated.domain },
    select: { id: true, workspaceId: true },
  });
  if (existing) {
    const err = new Error(
      existing.workspaceId === args.workspaceId
        ? 'Bu domain zaten workspace\'inize kayıtlı'
        : 'Bu domain başka bir workspace\'e kayıtlı'
    );
    (err as Error & { code?: string }).code = 'DOMAIN_ALREADY_EXISTS';
    throw err;
  }

  const site = await prisma.complianceSite.create({
    data: {
      workspaceId: args.workspaceId,
      domain: validated.domain,
      name: validated.name,
      contactEmail: validated.contactEmail,
      country: validated.country,
      language: validated.language,
      scanInterval: validated.scanInterval,
      status: 'pending',
      nextScanAt: new Date(Date.now() + scanIntervalToMs(validated.scanInterval)),
      notes: validated.notes ?? null,
    },
  });

  await logAudit({
    userId: args.userId,
    userEmail: args.userEmail,
    action: 'CREATE',
    resource: 'ComplianceSite',
    resourceId: site.id,
    details: { domain: site.domain, workspaceId: site.workspaceId },
  });

  logger.info('[compliance] Site added', {
    siteId: site.id,
    domain: site.domain,
    workspaceId: site.workspaceId,
  });

  return site;
}

// ============================================================================
// listComplianceSites
// ============================================================================

export async function listComplianceSites(
  workspaceId: string,
  query: ListSitesQuery
) {
  const q = ListSitesQuerySchema.parse(query);

  const where: Prisma.ComplianceSiteWhereInput = {
    workspaceId,
    ...(q.status ? { status: q.status } : {}),
    ...(q.search
      ? {
          OR: [
            { domain: { contains: q.search, mode: 'insensitive' } },
            { name: { contains: q.search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.complianceSite.findMany({
      where,
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      skip: (q.page - 1) * q.pageSize,
      take: q.pageSize,
      include: {
        _count: { select: { scans: true, policies: true, breaches: true } },
      },
    }),
    prisma.complianceSite.count({ where }),
  ]);

  return { items, total, page: q.page, pageSize: q.pageSize };
}

// ============================================================================
// getComplianceSite
// ============================================================================

export async function getComplianceSite(siteId: string, workspaceId: string) {
  return prisma.complianceSite.findFirst({
    where: { id: siteId, workspaceId },
    include: {
      _count: { select: { scans: true, policies: true, breaches: true } },
      scans: {
        orderBy: { startedAt: 'desc' },
        take: 5,
        select: {
          id: true,
          status: true,
          score: true,
          pagesScanned: true,
          durationMs: true,
          startedAt: true,
          completedAt: true,
        },
      },
      policies: {
        orderBy: { version: 'desc' },
        take: 3,
        select: {
          id: true,
          version: true,
          jurisdiction: true,
          generatedBy: true,
          approvedAt: true,
          publishedAt: true,
          createdAt: true,
        },
      },
    },
  });
}

// ============================================================================
// deleteComplianceSite
// ============================================================================

export async function deleteComplianceSite(
  siteId: string,
  workspaceId: string,
  auditContext: { userId?: string; userEmail?: string }
): Promise<void> {
  const site = await prisma.complianceSite.findFirst({
    where: { id: siteId, workspaceId },
    select: { id: true, domain: true },
  });
  if (!site) {
    const err = new Error('Site bulunamadı');
    (err as Error & { code?: string }).code = 'SITE_NOT_FOUND';
    throw err;
  }

  // Cascade: scans, policies, breaches (FK constraint sayesinde)
  await prisma.complianceSite.delete({ where: { id: site.id } });

  await logAudit({
    userId: auditContext.userId,
    userEmail: auditContext.userEmail,
    action: 'DELETE',
    resource: 'ComplianceSite',
    resourceId: site.id,
    details: { domain: site.domain, workspaceId },
  });

  logger.info('[compliance] Site deleted', {
    siteId: site.id,
    domain: site.domain,
    workspaceId,
  });
}

// ============================================================================
// startScan
// ============================================================================

export interface StartScanArgs {
  siteId: string;
  workspaceId: string;
  userId: string;
  userEmail?: string;
  input?: StartScanInput;
}

export async function startScan(args: StartScanArgs) {
  const input = StartScanSchema.parse(args.input ?? {});

  const site = await prisma.complianceSite.findFirst({
    where: { id: args.siteId, workspaceId: args.workspaceId },
    select: { id: true, domain: true, status: true },
  });
  if (!site) {
    const err = new Error('Site bulunamadı');
    (err as Error & { code?: string }).code = 'SITE_NOT_FOUND';
    throw err;
  }

  // Zaten çalışan scan varsa kuyruğa yenisini ekleme
  const running = await prisma.cookieScan.findFirst({
    where: { siteId: site.id, status: 'running' },
    select: { id: true, startedAt: true },
  });
  if (running) {
    const err = new Error(
      `Bu site için zaten çalışan bir scan var (id=${running.id}, başlangıç=${running.startedAt.toISOString()})`
    );
    (err as Error & { code?: string }).code = 'SCAN_ALREADY_RUNNING';
    throw err;
  }

  const scan = await prisma.cookieScan.create({
    data: {
      siteId: site.id,
      status: 'running',
      startedAt: new Date(),
    },
  });

  // Site status'u "scanning" olarak güncelle
  await prisma.complianceSite.update({
    where: { id: site.id },
    data: { status: 'scanning' },
  });

  // BullMQ'ya ekle (memory mode'da setTimeout)
  await queue.add({
    id: `compliance-scan-${scan.id}`,
    name: Jobs.ComplianceScan,
    data: { scanId: scan.id, siteId: site.id },
    attempts: 2,
  });

  await logAudit({
    userId: args.userId,
    userEmail: args.userEmail,
    action: 'CREATE',
    resource: 'CookieScan',
    resourceId: scan.id,
    details: {
      siteId: site.id,
      domain: site.domain,
      timeoutMs: input.timeoutMs,
    },
  });

  logger.info('[compliance] Scan started', {
    scanId: scan.id,
    siteId: site.id,
    domain: site.domain,
    workspaceId: args.workspaceId,
  });

  return { scanId: scan.id, status: scan.status, startedAt: scan.startedAt };
}

// ============================================================================
// getLatestScan
// ============================================================================

export async function getLatestScan(siteId: string, workspaceId: string) {
  // Workspace doğrulama
  const site = await prisma.complianceSite.findFirst({
    where: { id: siteId, workspaceId },
    select: { id: true },
  });
  if (!site) return null;

  return prisma.cookieScan.findFirst({
    where: { siteId, status: 'completed' },
    orderBy: { completedAt: 'desc' },
  });
}

// ============================================================================
// listScans
// ============================================================================

export async function listScans(
  siteId: string,
  workspaceId: string,
  query: ListScansQuery
) {
  const q = ListScansQuerySchema.parse(query);

  // Workspace doğrulama
  const site = await prisma.complianceSite.findFirst({
    where: { id: siteId, workspaceId },
    select: { id: true },
  });
  if (!site) {
    return { items: [], total: 0, page: q.page, pageSize: q.pageSize };
  }

  const [items, total] = await Promise.all([
    prisma.cookieScan.findMany({
      where: { siteId: site.id },
      orderBy: { startedAt: 'desc' },
      skip: (q.page - 1) * q.pageSize,
      take: q.pageSize,
      select: {
        id: true,
        status: true,
        score: true,
        pagesScanned: true,
        durationMs: true,
        startedAt: true,
        completedAt: true,
        errorMessage: true,
      },
    }),
    prisma.cookieScan.count({ where: { siteId: site.id } }),
  ]);

  return { items, total, page: q.page, pageSize: q.pageSize };
}

// ============================================================================
// updateSiteStatus
// ============================================================================

export async function updateSiteStatus(
  siteId: string,
  workspaceId: string,
  args: UpdateSiteStatusInput & { userId?: string; userEmail?: string }
) {
  const validated = UpdateSiteStatusSchema.parse(args);

  const site = await prisma.complianceSite.findFirst({
    where: { id: siteId, workspaceId },
    select: { id: true, status: true },
  });
  if (!site) {
    const err = new Error('Site bulunamadı');
    (err as Error & { code?: string }).code = 'SITE_NOT_FOUND';
    throw err;
  }

  const updated = await prisma.complianceSite.update({
    where: { id: site.id },
    data: {
      status: validated.status,
      notes: validated.notes ?? undefined,
    },
  });

  await logAudit({
    userId: args.userId,
    userEmail: args.userEmail,
    action: 'UPDATE',
    resource: 'ComplianceSite',
    resourceId: site.id,
    details: {
      previousStatus: site.status,
      newStatus: validated.status,
    },
  });

  logger.info('[compliance] Site status updated', {
    siteId: site.id,
    previous: site.status,
    current: validated.status,
  });

  return updated;
}

// ============================================================================
// scheduleNextScan
// ============================================================================

export interface ScheduleNextScanResult {
  siteId: string;
  scanInterval: ScanInterval;
  nextScanAt: Date;
  queuedImmediately: boolean;
  queuedScanId?: string;
}

export async function scheduleNextScan(
  siteId: string,
  workspaceId: string,
  args: ScheduleNextScanInput & { userId?: string; userEmail?: string }
): Promise<ScheduleNextScanResult> {
  const validated = ScheduleNextScanSchema.parse(args);

  const site = await prisma.complianceSite.findFirst({
    where: { id: siteId, workspaceId },
    select: { id: true, scanInterval: true },
  });
  if (!site) {
    const err = new Error('Site bulunamadı');
    (err as Error & { code?: string }).code = 'SITE_NOT_FOUND';
    throw err;
  }

  const nextScanAt = new Date(Date.now() + scanIntervalToMs(validated.scanInterval));

  await prisma.complianceSite.update({
    where: { id: site.id },
    data: {
      scanInterval: validated.scanInterval,
      nextScanAt,
    },
  });

  let queuedScanId: string | undefined;
  if (validated.forceNow) {
    const scan = await startScan({
      siteId: site.id,
      workspaceId,
      userId: args.userId ?? 'system',
      userEmail: args.userEmail,
    });
    queuedScanId = scan.scanId;
  }

  await logAudit({
    userId: args.userId,
    userEmail: args.userEmail,
    action: 'UPDATE',
    resource: 'ComplianceSite',
    resourceId: site.id,
    details: {
      scanInterval: validated.scanInterval,
      nextScanAt: nextScanAt.toISOString(),
      forceNow: validated.forceNow,
    },
  });

  logger.info('[compliance] Schedule updated', {
    siteId: site.id,
    scanInterval: validated.scanInterval,
    nextScanAt,
    forceNow: validated.forceNow,
  });

  return {
    siteId: site.id,
    scanInterval: validated.scanInterval,
    nextScanAt,
    queuedImmediately: validated.forceNow,
    queuedScanId,
  };
}

// ============================================================================
// runComplianceAnalysis — Phase 4 C.2
// ============================================================================

/**
 * Ham crawl çıktısını (scanner.ts'ten) alıp KVKK/GDPR tehdit analizi yapar.
 *
 * Pipeline (her adım pure function, kolay unit test):
 *   1. classifyCookies(cookieNames)        → CookieRecord[]
 *   2. detectTrackingScripts(scripts)      → TrackingScript[]
 *   3. analyzeForms(forms)                 → FormRecord[]
 *   4. evaluateThreats(ctx)                → Threat[]
 *   5. computeComplianceScore(threats)     → number (0-100)
 *
 * Bu fonksiyon DB'ye dokunmaz — side-effect'siz, idempotent. queueHandlers
 * veya test ortamları doğrudan kullanabilir.
 */
export interface RawCrawlInput {
  /** Tarama yapılan domain (https kontrolü için kullanılabilir). */
  domain: string;
  /** Cookie adları (Playwright context.cookies() çıktısı). */
  cookieNames: readonly string[];
  /** Script src + inline içerikleri (document.scripts çıktısı). */
  scripts: ReadonlyArray<{ src: string; inline?: string | null }>;
  /** Ham form verileri (page.evaluate ile toplanan). */
  forms: ReadonlyArray<{
    url: string;
    action?: string;
    method: string;
    fields: ReadonlyArray<{ name: string; type: string; required: boolean }>;
  }>;
  /** Taranan sayfa URL'leri (HTTPS kontrolü için). */
  pageUrls: readonly string[];
  /** Sayfalarda privacy policy link'i tespit edildi mi? */
  hasPrivacyPolicyLink: boolean;
  /** Sitede /cerez-politikasi sayfası var mı? */
  hasCookiePolicyPage: boolean;
  /** Cookie consent banner mevcut mu? */
  hasCookieBanner: boolean;
}

export interface ComplianceAnalysisOutput {
  cookies: CookieRecord[];
  trackingScripts: TrackingScript[];
  forms: FormRecord[];
  threats: Threat[];
  score: number;
}

export function runComplianceAnalysis(input: RawCrawlInput): ComplianceAnalysisOutput {
  // 1. Cookies
  const cookies = classifyCookies(input.cookieNames);

  // 2. Tracking scripts
  const trackingScripts = detectTrackingScripts(input.scripts);

  // 3. Forms
  const forms = analyzeForms(input.forms);

  // 4. Threats (rules engine)
  const threats = evaluateThreats({
    cookies,
    trackingScripts,
    forms,
    pageUrls: input.pageUrls,
    hasPrivacyPolicyLink: input.hasPrivacyPolicyLink,
    hasCookiePolicyPage: input.hasCookiePolicyPage,
    hasCookieBanner: input.hasCookieBanner,
  });

  // 5. Score
  const score = computeComplianceScore(threats);

  return { cookies, trackingScripts, forms, threats, score };
}

// ============================================================================
// finalizeScan — Phase 4 C.2
// ============================================================================

/**
 * ComplianceScan sonucunu DB'ye yazar, ComplianceSite status/complianceScore
 * günceller ve bir sonraki scan zamanını ayarlar. Atomic transaction.
 *
 * queueHandlers içinde runComplianceScan bu fonksiyonu kullanır; ayrıca
 * test ortamları ve gelecekteki webhooks da çağırabilir.
 *
 * @returns Güncellenen scan + site
 */
export interface FinalizeScanArgs {
  scanId: string;
  workspaceId: string;
  userId?: string;
  userEmail?: string;
  result: ComplianceAnalysisOutput;
  pagesScanned: number;
  durationMs: number;
}

export interface FinalizeScanResult {
  scanId: string;
  siteId: string;
  score: number;
  newStatus: SiteStatus;
  threatsCount: number;
}

export async function finalizeScan(args: FinalizeScanArgs): Promise<FinalizeScanResult> {
  // Scan + site lookup
  const scan = await prisma.cookieScan.findUnique({
    where: { id: args.scanId },
    include: {
      site: {
        select: { id: true, workspaceId: true, domain: true, scanInterval: true },
      },
    },
  });

  if (!scan) {
    const err = new Error(`CookieScan bulunamadı: ${args.scanId}`);
    (err as Error & { code?: string }).code = 'SCAN_NOT_FOUND';
    throw err;
  }

  if (scan.site.workspaceId !== args.workspaceId) {
    const err = new Error('Workspace uyuşmazlığı');
    (err as Error & { code?: string }).code = 'WORKSPACE_MISMATCH';
    throw err;
  }

  const newStatus = deriveSiteStatus(args.result.score, args.result.threats.length);
  const nextScanAt = new Date(
    Date.now() + scanIntervalToMs(scan.site.scanInterval as ScanInterval)
  );

  // Atomic transaction
  await prisma.$transaction(async (tx) => {
    await tx.cookieScan.update({
      where: { id: args.scanId },
      data: {
        status: 'completed',
        completedAt: new Date(),
        durationMs: args.durationMs,
        pagesScanned: args.pagesScanned,
        cookies: args.result.cookies as unknown as Prisma.InputJsonValue,
        trackingScripts: args.result.trackingScripts as unknown as Prisma.InputJsonValue,
        forms: args.result.forms as unknown as Prisma.InputJsonValue,
        threats: args.result.threats as unknown as Prisma.InputJsonValue,
        score: args.result.score,
      },
    });

    await tx.complianceSite.update({
      where: { id: scan.site.id },
      data: {
        status: newStatus,
        complianceScore: args.result.score,
        lastScanAt: new Date(),
        nextScanAt,
      },
    });
  });

  await logAudit({
    userId: args.userId,
    userEmail: args.userEmail,
    action: 'AI_GENERATE',
    resource: 'CookieScan',
    resourceId: args.scanId,
    details: {
      siteId: scan.site.id,
      domain: scan.site.domain,
      score: args.result.score,
      threatsCount: args.result.threats.length,
      newStatus,
      durationMs: args.durationMs,
    },
  });

  logger.info('[compliance] Scan finalized', {
    scanId: args.scanId,
    siteId: scan.site.id,
    domain: scan.site.domain,
    score: args.result.score,
    threats: args.result.threats.length,
    newStatus,
  });

  return {
    scanId: args.scanId,
    siteId: scan.site.id,
    score: args.result.score,
    newStatus,
    threatsCount: args.result.threats.length,
  };
}

// ============================================================================
// deriveSiteStatus (internal helper)
// ============================================================================

/**
 * Compliance skoruna göre site status'unu belirler.
 * queueHandlers.ts ile aynı mantık — burada da exposed.
 */
function deriveSiteStatus(score: number, threatCount: number): SiteStatus {
  if (threatCount === 0 && score >= 90) return 'compliant';
  if (score >= 70) return 'warning';
  return 'critical';
}

// ============================================================================
// Service namespace export
// ============================================================================

export const complianceService = {
  addComplianceSite,
  listComplianceSites,
  getComplianceSite,
  deleteComplianceSite,
  startScan,
  getLatestScan,
  listScans,
  updateSiteStatus,
  scheduleNextScan,
  runComplianceAnalysis,
  finalizeScan,
  listBreachIncidents,
  resolveIncident,
};

// ============================================================================
// listBreachIncidents — Phase 4 C.6
// ============================================================================

/**
 * Severity için Zod sub-schema (reusable).
 */
const BreachSeveritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);

export interface ListBreachIncidentsQuery {
  page?: number;
  pageSize?: number;
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  siteId?: string;
  resolved?: boolean;
}

/**
 * Workspace'e ait DataBreachIncident'ları sayfalı listeler. Severity, siteId
 * ve resolved filter'ları opsiyonel. Audit trail için default sıralama:
 * detectedAt desc.
 */
export async function listBreachIncidents(
  workspaceId: string,
  query: ListBreachIncidentsQuery = {}
) {
  const page = Math.max(1, Math.min(1000, query.page ?? 1));
  const pageSize = Math.max(1, Math.min(100, query.pageSize ?? 20));
  const severity = query.severity
    ? BreachSeveritySchema.parse(query.severity)
    : undefined;

  const where: Prisma.DataBreachIncidentWhereInput = {
    workspaceId,
    ...(severity ? { severity } : {}),
    ...(query.siteId ? { siteId: query.siteId } : {}),
    ...(typeof query.resolved === 'boolean'
      ? query.resolved
        ? { resolvedAt: { not: null } }
        : { resolvedAt: null }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.dataBreachIncident.findMany({
      where,
      orderBy: [{ detectedAt: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        workspaceId: true,
        siteId: true,
        severity: true,
        title: true,
        description: true,
        affectedUsers: true,
        dataCategories: true,
        detectedAt: true,
        reportedAt: true,
        resolvedAt: true,
        notifyKvkk: true,
        sentryAlertId: true,
        metadata: true,
        createdAt: true,
      },
    }),
    prisma.dataBreachIncident.count({ where }),
  ]);

  return { items, total, page, pageSize };
}

// ============================================================================
// resolveIncident — Phase 4 C.6
// ============================================================================

export interface ResolveIncidentArgs {
  incidentId: string;
  workspaceId: string;
  userId: string;
  userEmail?: string;
  /** Çözüm notu (audit metadata'ya yazılır). */
  resolutionNote?: string;
}

export interface ResolveIncidentResult {
  incidentId: string;
  resolvedAt: Date;
  severity: string;
}

/**
 * DataBreachIncident'ı resolved olarak işaretler. KVKK bildirim süreci
 * (72 saat) burada başlamaz — sadece workspace içi "yönetildi" flag'idir.
 *
 * Audit log + Sentry correlation metadata update edilir.
 */
export async function resolveIncident(
  args: ResolveIncidentArgs
): Promise<ResolveIncidentResult> {
  // Workspace doğrulama
  const incident = await prisma.dataBreachIncident.findFirst({
    where: { id: args.incidentId, workspaceId: args.workspaceId },
    select: { id: true, severity: true, resolvedAt: true },
  });
  if (!incident) {
    const err = new Error('Breach incident bulunamadı');
    (err as Error & { code?: string }).code = 'INCIDENT_NOT_FOUND';
    throw err;
  }

  if (incident.resolvedAt) {
    logger.warn('[compliance] Breach incident zaten çözülmüş', {
      incidentId: incident.id,
      resolvedAt: incident.resolvedAt,
    });
    return {
      incidentId: incident.id,
      resolvedAt: incident.resolvedAt,
      severity: incident.severity,
    };
  }

  const resolvedAt = new Date();
  const updated = await prisma.dataBreachIncident.update({
    where: { id: incident.id },
    data: {
      resolvedAt,
      metadata: {
        resolvedBy: args.userId,
        resolvedByEmail: args.userEmail ?? null,
        resolutionNote: args.resolutionNote ?? null,
        resolvedAt: resolvedAt.toISOString(),
      } as Prisma.InputJsonValue,
    },
  });

  await logAudit({
    userId: args.userId,
    userEmail: args.userEmail,
    action: 'UPDATE',
    resource: 'DataBreachIncident',
    resourceId: incident.id,
    details: {
      action: 'resolve',
      severity: incident.severity,
      resolutionNote: args.resolutionNote ?? null,
    },
  });

  logger.info('[compliance] Breach incident resolved', {
    incidentId: incident.id,
    userId: args.userId,
    severity: incident.severity,
  });

  return {
    incidentId: updated.id,
    resolvedAt: updated.resolvedAt!,
    severity: updated.severity,
  };
}

// ============================================================================
// Type exports (yeniden export — convenience)
// ============================================================================

export type { SiteStatus, ScanInterval };
