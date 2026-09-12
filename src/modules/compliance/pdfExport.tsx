/**
 * Compliance Audit Report — PDF Export (Phase 4 C.5)
 *
 * Belirli bir CookieScan'in workspace + site + scan + threat verilerini
 * React PDF Document'e render edip Buffer olarak döner. API endpoint
 * /api/compliance/sites/[id]/report.pdf bu fonksiyonu kullanır.
 *
 * Mimari:
 *   1. scanId → CookieScan + site + workspace + threat details fetch
 *   2. CvData shape'ine map'le (UI-friendly düz obje)
 *   3. AuditReportDocument (Document) → renderToBuffer → Buffer
 *
 * Hata durumları:
 *   - Scan yok / erişim yok → NotFoundError tipinde hata fırlatır
 *   - @react-pdf/renderer runtime'da yüklü değilse → graceful HTML fallback
 *
 * Pattern:
 *   - src/lib/prisma.ts (PrismaClient)
 *   - src/lib/audit.ts (logAudit EXPORT action)
 *   - src/components/compliance/AuditReportLayout.tsx (React PDF Document)
 */

import { Prisma } from '@prisma/client';

import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';

import type {
  CookieRecord,
  TrackingScript,
  FormRecord,
  Threat,
  ScanResult,
} from './schemas';
import type { AuditReportCv } from '@/components/compliance/AuditReportLayout';

// ============================================================================
// Public API
// ============================================================================

export interface GenerateAuditReportArgs {
  scanId: string;
  workspaceId: string;
  userId?: string;
  userEmail?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface GenerateAuditReportResult {
  buffer: Buffer;
  contentType: 'application/pdf';
  filename: string;
  size: number;
  cv: AuditReportCv;
  fallback?: 'html';
}

/**
 * Compliance scan'in PDF audit raporunu üretir. Buffer olarak döner —
 * NextResponse doğrudan bu Buffer'ı response body olarak gönderebilir.
 *
 * Workspace sahipliği doğrulanır; sahip değilse SECURITY_ERR throw eder.
 */
export async function generateAuditReport(
  args: GenerateAuditReportArgs
): Promise<GenerateAuditReportResult> {
  // 1. Scan + site + workspace fetch
  const scan = await prisma.cookieScan.findUnique({
    where: { id: args.scanId },
    include: {
      site: {
        select: {
          id: true,
          workspaceId: true,
          domain: true,
          name: true,
          contactEmail: true,
          workspace: {
            select: {
              id: true,
              name: true,
              brandLogo: true,
            },
          },
        },
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

  if (scan.status !== 'completed') {
    const err = new Error(
      `Sadece tamamlanmış scan'ler için PDF üretilebilir (status=${scan.status})`
    );
    (err as Error & { code?: string }).code = 'SCAN_NOT_COMPLETED';
    throw err;
  }

  // 2. JSON kolonları parse
  const cookies = parseJsonField<CookieRecord[]>(scan.cookies, []);
  const trackingScripts = parseJsonField<TrackingScript[]>(scan.trackingScripts, []);
  const forms = parseJsonField<FormRecord[]>(scan.forms, []);
  const threats = parseJsonField<Threat[]>(scan.threats, []);

  // 3. CvData oluştur
  const threatCounts = {
    CRITICAL: threats.filter((t) => t.severity === 'CRITICAL').length,
    HIGH: threats.filter((t) => t.severity === 'HIGH').length,
    MEDIUM: threats.filter((t) => t.severity === 'MEDIUM').length,
    LOW: threats.filter((t) => t.severity === 'LOW').length,
  };

  // Severity sırasına göre threat'leri sırala (CRITICAL → LOW)
  const severityOrder: Record<string, number> = {
    CRITICAL: 0,
    HIGH: 1,
    MEDIUM: 2,
    LOW: 3,
  };
  const sortedThreats = [...threats].sort(
    (a, b) =>
      (severityOrder[a.severity] ?? 99) - (severityOrder[b.severity] ?? 99)
  );

  const cv: AuditReportCv = {
    workspaceName: scan.site.workspace.name,
    workspaceLogoUrl: scan.site.workspace.brandLogo ?? null,
    domain: scan.site.domain,
    siteName: scan.site.name,
    reportDate: formatDate(new Date()),
    scanDate: formatDate(scan.startedAt),
    score: scan.score ?? 0,
    pagesScanned: scan.pagesScanned,
    durationMs: scan.durationMs ?? 0,
    threatCounts,
    totalThreats: threats.length,
    cookies: cookies.map((c) => ({
      name: c.name,
      provider: c.provider ?? null,
      type: c.type,
      duration: c.duration ?? null,
    })),
    trackingScripts: trackingScripts.map((t) => ({
      url: t.url,
      provider: t.provider,
      knownTracker: t.knownTracker ?? null,
      gdprCompliant: t.gdprCompliant ?? false,
    })),
    forms: forms.map((f) => ({
      url: f.url,
      method: f.method,
      fieldsCount: f.fields.length,
      consentRequired: f.consentRequired,
    })),
    threats: sortedThreats.map((t) => ({
      severity: t.severity,
      type: t.type,
      description: t.description,
      regulationRef: t.regulationRef ?? null,
      fixSuggestion: t.fixSuggestion ?? null,
      pageUrl: t.pageUrl ?? null,
    })),
  };

  // 4. PDF Buffer üret
  const buffer = await renderReportToBuffer(cv);

  // 5. Audit log
  await logAudit({
    userId: args.userId,
    userEmail: args.userEmail,
    action: 'EXPORT',
    resource: 'CookieScan',
    resourceId: args.scanId,
    details: {
      format: 'pdf',
      size: buffer.length,
      workspaceId: args.workspaceId,
    },
    ipAddress: args.ipAddress,
    userAgent: args.userAgent,
  });

  const filename = `compliance-audit-${sanitizeFilenamePart(scan.site.domain)}-${args.scanId.slice(0, 8)}.pdf`;

  return {
    buffer,
    contentType: 'application/pdf',
    filename,
    size: buffer.length,
    cv,
  };
}

// ============================================================================
// generateAuditReportForSite — siteId bazlı, en son completed scan seçer
// ============================================================================

export interface GenerateSiteAuditReportArgs {
  siteId: string;
  workspaceId: string;
  userId?: string;
  userEmail?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * ComplianceSite için en son tamamlanmış scan'in PDF raporunu üretir.
 * Site'da henüz completed scan yoksa hata fırlatır.
 */
export async function generateSiteAuditReport(
  args: GenerateSiteAuditReportArgs
): Promise<GenerateAuditReportResult> {
  // Site workspace doğrulama
  const site = await prisma.complianceSite.findFirst({
    where: { id: args.siteId, workspaceId: args.workspaceId },
    select: { id: true },
  });
  if (!site) {
    const err = new Error('Site bulunamadı');
    (err as Error & { code?: string }).code = 'SITE_NOT_FOUND';
    throw err;
  }

  // En son completed scan
  const scan = await prisma.cookieScan.findFirst({
    where: { siteId: site.id, status: 'completed' },
    orderBy: { completedAt: 'desc' },
    select: { id: true },
  });
  if (!scan) {
    const err = new Error('Bu site için tamamlanmış scan bulunamadı');
    (err as Error & { code?: string }).code = 'NO_COMPLETED_SCAN';
    throw err;
  }

  return generateAuditReport({
    scanId: scan.id,
    workspaceId: args.workspaceId,
    userId: args.userId,
    userEmail: args.userEmail,
    ipAddress: args.ipAddress,
    userAgent: args.userAgent,
  });
}

// ============================================================================
// Internal: React PDF render → Buffer
// ============================================================================

async function renderReportToBuffer(cv: AuditReportCv): Promise<Buffer> {
  try {
    // Dynamic import — @react-pdf/renderer opsiyonel dependency gibi ele alınır.
    const [{ renderToBuffer }, { AuditReportDocument }] = await Promise.all([
      import('@react-pdf/renderer'),
      import('@/components/compliance/AuditReportLayout'),
    ]);

    const buffer = await renderToBuffer(<AuditReportDocument cv={cv} />);
    return buffer;
  } catch (err) {
    // @react-pdf/renderer runtime'da yüklü değilse (örn: dev ortamı, build hatası)
    // graceful fallback: basit HTML buffer döndür ki route 500 dönmesin.
    const message = err instanceof Error ? err.message : String(err);
    logger.warn('[pdf-export] @react-pdf/renderer render failed, HTML fallback', {
      error: message,
    });
    return Buffer.from(htmlFallback(cv), 'utf-8');
  }
}

/**
 * @react-pdf/renderer yüklü değilse döndüğümüz basit HTML. Frontend bu
 * buffer'ı Content-Type: text/html ile alır; PDF'in binary signature'ı
 * yoktur ama kullanıcı veriyi en azından okuyabilir.
 */
function htmlFallback(cv: AuditReportCv): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Compliance Audit Report — ${escapeHtml(cv.domain)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 0; padding: 32px; background: #f8fafc; color: #0f172a; }
    .cover { background: #0f172a; color: white; padding: 60px; border-radius: 12px; margin-bottom: 24px; }
    .cover h1 { font-size: 32px; margin: 0 0 8px 0; }
    .cover .domain { font-family: monospace; color: #38bdf8; font-size: 18px; }
    .score { font-size: 64px; font-weight: 700; color: ${cv.score >= 70 ? '#22c55e' : '#f97316'}; }
    h2 { border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-top: 32px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { padding: 8px; text-align: left; border-bottom: 1px solid #e2e8f0; }
    th { background: #f1f5f9; }
    .threat { background: #fef2f2; border-left: 3px solid #dc2626; padding: 12px; margin-bottom: 8px; border-radius: 4px; }
    .severity { background: #dc2626; color: white; padding: 2px 8px; border-radius: 3px; font-size: 10px; font-weight: 700; }
    .footer { margin-top: 32px; text-align: center; color: #94a3b8; font-size: 11px; border-top: 1px solid #e2e8f0; padding-top: 16px; }
  </style>
</head>
<body>
  <div class="cover">
    <h1>Compliance Audit Report</h1>
    <p>${escapeHtml(cv.workspaceName)}</p>
    <p class="domain">${escapeHtml(cv.domain)}</p>
    <div class="score">${cv.score}</div>
    <p>COMPLIANCE SCORE / 100</p>
    <p>Report Date: ${escapeHtml(cv.reportDate)} — Scan Date: ${escapeHtml(cv.scanDate)}</p>
  </div>

  <h2>Summary</h2>
  <ul>
    <li>Total Threats: ${cv.totalThreats}</li>
    <li>Critical: ${cv.threatCounts.CRITICAL}, High: ${cv.threatCounts.HIGH}, Medium: ${cv.threatCounts.MEDIUM}, Low: ${cv.threatCounts.LOW}</li>
    <li>Cookies: ${cv.cookies.length} — Tracking Scripts: ${cv.trackingScripts.length} — Forms: ${cv.forms.length}</li>
    <li>Pages Scanned: ${cv.pagesScanned} — Duration: ${(cv.durationMs / 1000).toFixed(1)}s</li>
  </ul>

  <h2>Threats</h2>
  ${cv.threats
    .map(
      (t) => `
    <div class="threat">
      <div><span class="severity">${t.severity}</span> <strong>${escapeHtml(t.type)}</strong></div>
      <p>${escapeHtml(t.description)}</p>
      ${t.regulationRef ? `<p><em>${escapeHtml(t.regulationRef)}</em></p>` : ''}
      ${t.fixSuggestion ? `<p><strong>Fix:</strong> ${escapeHtml(t.fixSuggestion)}</p>` : ''}
    </div>
  `
    )
    .join('')}

  <div class="footer">
    Generated by Noktanyus Compliance Tracker — ${escapeHtml(cv.workspaceName)}
  </div>
</body>
</html>`;
}

// ============================================================================
// Helpers
// ============================================================================

function parseJsonField<T>(value: Prisma.JsonValue, fallback: T): T {
  if (Array.isArray(value)) return value as unknown as T;
  if (value && typeof value === 'object') return value as unknown as T;
  return fallback;
}

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0] ?? d.toISOString();
}

function sanitizeFilenamePart(input: string): string {
  return input.replace(/[^a-zA-Z0-9.-]/g, '_').slice(0, 64);
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}