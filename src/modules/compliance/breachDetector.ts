/**
 * Data Breach Detector — Phase 4 C.6
 *
 * KVKK Madde 12 (72 saat bildirim) ve GDPR Art. 33 uyumlu data breach
 * incident yönetimi. İki giriş noktası:
 *   1. processBreachSignal: Manuel API veya internal source'dan breach sinyali
 *   2. handleSentryAlert: Sentry webhook → otomatik incident oluşturma
 *
 * Her iki yol da aynı processBreachSignal fonksiyonunu çağırır; fark sadece
 * metadata enrichment'tedir.
 *
 * Pipeline:
 *   1. Sinyal al → severity + scope normalize
 *   2. DataBreachIncident oluştur (DB write)
 *   3. Sentry'ye captureMessage gönder (correlation için)
 *   4. Email bildirim (workspace owner + ADMIN_EMAIL)
 *   5. Audit log
 *
 * Pattern:
 *   - src/lib/prisma.ts
 *   - src/lib/audit.ts (logAudit)
 *   - src/lib/logger.ts (Sentry captureException)
 *   - src/lib/emailService.ts (bildirim)
 *   - @sentry/nextjs (captureMessage)
 */

import * as Sentry from '@sentry/nextjs';
import { Prisma } from '@prisma/client';

import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';
import { sendEmail } from '@/lib/email';
import {
  isVerbisConfigured,
  submitBreachNotification,
  computeMadde12Deadline,
  type VerbisBreachNotificationPayload,
  type VerbisSubmissionResult,
} from '@/lib/verbis';

// ============================================================================
// Public types
// ============================================================================

export type BreachSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface BreachSignal {
  /** Olay kaynağı — "manual" | "sentry" | "internal" | "scan" */
  source: 'manual' | 'sentry' | 'internal' | 'scan' | string;
  /** KVKK/GDPR severity. */
  severity: BreachSeverity;
  /** Kısa başlık. */
  title: string;
  /** Detaylı açıklama (Markdown / plain text kabul edilir). */
  description: string;
  /** Workspace ID. */
  workspaceId: string;
  /** İlgili ComplianceSite ID (opsiyonel). */
  siteId?: string;
  /** Tahmini etkilenen kullanıcı sayısı. */
  affectedUsers?: number;
  /** Etkilenen veri kategorileri (örn: ["email", "phone", "payment_info"]). */
  dataCategories?: string[];
  /** Sentry alert ID (varsa — duplicate guard için). */
  sentryAlertId?: string;
  /** Ek metadata (JSON serileştirilebilir). */
  metadata?: Record<string, unknown>;
}

export interface ProcessBreachSignalResult {
  incidentId: string;
  workspaceId: string;
  severity: BreachSeverity;
  notifyKvkk: boolean;
  sentryCaptured: boolean;
  emailSent: boolean;
  duplicate: boolean;
}

// ============================================================================
// processBreachSignal
// ============================================================================

/**
 * Breach sinyalini alır, DataBreachIncident oluşturur, Sentry'ye bildirim,
 * email gönderir ve audit log yazar. Idempotent: aynı sentryAlertId ile
 * ikinci çağrı mevcut incident'ı döner.
 *
 * Hata durumları:
 *   - workspaceId invalid → WORKSPACE_NOT_FOUND
 *   - DB insert fail → INSERT_FAILED (retry için throw)
 */
export async function processBreachSignal(
  signal: BreachSignal
): Promise<ProcessBreachSignalResult> {
  // 1. Workspace doğrulama
  const workspace = await prisma.workspace.findUnique({
    where: { id: signal.workspaceId },
    select: { id: true, name: true, ownerId: true },
  });
  if (!workspace) {
    const err = new Error('Workspace bulunamadı');
    (err as Error & { code?: string }).code = 'WORKSPACE_NOT_FOUND';
    throw err;
  }

  // 2. Duplicate guard (sentryAlertId ile)
  if (signal.sentryAlertId) {
    const existing = await prisma.dataBreachIncident.findFirst({
      where: { sentryAlertId: signal.sentryAlertId },
      select: { id: true, severity: true, notifyKvkk: true },
    });
    if (existing) {
      logger.warn('[breach-detector] Duplicate breach signal', {
        incidentId: existing.id,
        sentryAlertId: signal.sentryAlertId,
      });
      return {
        incidentId: existing.id,
        workspaceId: signal.workspaceId,
        severity: existing.severity as BreachSeverity,
        notifyKvkk: existing.notifyKvkk,
        sentryCaptured: false,
        emailSent: false,
        duplicate: true,
      };
    }
  }

  // 3. KVKK notification flag (HIGH/CRITICAL → true, KVKK Madde 12)
  const notifyKvkk = signal.severity === 'HIGH' || signal.severity === 'CRITICAL';

  // L8 — KVKK Madde 12 deadline hesaplama (detectedAt + 72 saat).
  const detectedAt = new Date();
  const kvkkMadde12Deadline = computeMadde12Deadline(detectedAt);

  // 4. Site scope doğrulama (varsa)
  if (signal.siteId) {
    const site = await prisma.complianceSite.findFirst({
      where: { id: signal.siteId, workspaceId: signal.workspaceId },
      select: { id: true },
    });
    if (!site) {
      const err = new Error(
        `Site workspace'e ait değil (siteId=${signal.siteId}, workspaceId=${signal.workspaceId})`
      );
      (err as Error & { code?: string }).code = 'SITE_WORKSPACE_MISMATCH';
      throw err;
    }
  }

  // 5. DB insert
  let incident;
  try {
    incident = await prisma.dataBreachIncident.create({
      data: {
        workspaceId: signal.workspaceId,
        siteId: signal.siteId ?? null,
        severity: signal.severity,
        title: signal.title,
        description: signal.description,
        affectedUsers: signal.affectedUsers ?? null,
        dataCategories: signal.dataCategories
          ? (signal.dataCategories as unknown as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        notifyKvkk,
        sentryAlertId: signal.sentryAlertId ?? null,
        metadata: signal.metadata
          ? (signal.metadata as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        detectedAt,
        kvkkMadde12Deadline,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('[breach-detector] DB insert başarısız', {
      workspaceId: signal.workspaceId,
      severity: signal.severity,
      error: message,
    });
    throw err;
  }

  // 6. Sentry captureMessage (correlation + alert routing)
  let sentryCaptured = false;
  try {
    Sentry.captureMessage(
      `[DATA BREACH] ${signal.severity} — ${signal.title}`,
      {
        level: severityToSentryLevel(signal.severity),
        tags: {
          workspaceId: signal.workspaceId,
          workspaceName: workspace.name,
          siteId: signal.siteId ?? 'none',
          severity: signal.severity,
          notifyKvkk: String(notifyKvkk),
          source: signal.source,
        },
        extra: {
          incidentId: incident.id,
          description: signal.description,
          affectedUsers: signal.affectedUsers ?? null,
          dataCategories: signal.dataCategories ?? [],
          sentryAlertId: signal.sentryAlertId ?? null,
          ...(signal.metadata ?? {}),
        },
      }
    );
    sentryCaptured = true;
  } catch (err) {
    logger.warn('[breach-detector] Sentry captureMessage başarısız', {
      error: err instanceof Error ? err.message : String(err),
    });
  }

  // 7. Email bildirim (workspace owner + ADMIN_EMAIL)
  let emailSent = false;
  try {
    const recipients = await resolveBreachRecipients(workspace.ownerId);
    if (recipients.length > 0) {
      const html = renderBreachEmailHtml({
        title: signal.title,
        description: signal.description,
        severity: signal.severity,
        notifyKvkk,
        incidentId: incident.id,
        workspaceName: workspace.name,
        detectedAt: incident.detectedAt,
        affectedUsers: signal.affectedUsers,
        dataCategories: signal.dataCategories,
      });

      const sendResult = await sendEmail({
        to: recipients,
        subject: `[DATA BREACH ${signal.severity}] ${signal.title}`,
        html,
        text: `${signal.title}\n\nSeverity: ${signal.severity}\nWorkspace: ${workspace.name}\nDetected: ${incident.detectedAt.toISOString()}\n\n${signal.description}`,
      });

      emailSent = sendResult.success;
      if (sendResult.success) {
        await prisma.dataBreachIncident.update({
          where: { id: incident.id },
          data: { reportedAt: new Date() },
        });
      } else {
        logger.warn('[breach-detector] Email gönderimi başarısız', {
          incidentId: incident.id,
          error: sendResult.error,
        });
      }
    }
  } catch (err) {
    logger.warn('[breach-detector] Email notification hatası', {
      incidentId: incident.id,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  // 8. Audit log
  await logAudit({
    action: 'CREATE',
    resource: 'DataBreachIncident',
    resourceId: incident.id,
    details: {
      workspaceId: signal.workspaceId,
      siteId: signal.siteId ?? null,
      severity: signal.severity,
      source: signal.source,
      title: signal.title,
      notifyKvkk,
      sentryCaptured,
      emailSent,
      sentryAlertId: signal.sentryAlertId ?? null,
    },
  });

  logger.warn('[breach-detector] Breach incident oluşturuldu', {
    incidentId: incident.id,
    workspaceId: signal.workspaceId,
    severity: signal.severity,
    notifyKvkk,
  });

  return {
    incidentId: incident.id,
    workspaceId: signal.workspaceId,
    severity: signal.severity,
    notifyKvkk,
    sentryCaptured,
    emailSent,
    duplicate: false,
  };
}

// ============================================================================
// handleSentryAlert — Sentry webhook payload → BreachSignal
// ============================================================================

/**
 * Sentry webhook payload'ından BreachSignal çıkarır ve processBreachSignal'e
 * iletir. Sentry alert payload shape'i: { id, title, level, message, ... }
 *
 * Sentry severity mapping:
 *   - fatal   → CRITICAL
 *   - error   → HIGH
 *   - warning → MEDIUM
 *   - info    → LOW
 */
export async function handleSentryAlert(
  workspaceId: string,
  payload: SentryAlertPayload
): Promise<ProcessBreachSignalResult> {
  const severity = sentryLevelToBreachSeverity(payload.level);

  const signal: BreachSignal = {
    source: 'sentry',
    severity,
    title: payload.title || payload.message || 'Sentry alert',
    description: payload.message || payload.title || 'Sentry triggered alert',
    workspaceId,
    siteId: payload.tags?.siteId ?? undefined,
    sentryAlertId: payload.id,
    affectedUsers: undefined,
    dataCategories: extractDataCategoriesFromTags(payload.tags),
    metadata: {
      sentryLevel: payload.level,
      sentryProject: payload.project ?? null,
      sentryUrl: payload.url ?? null,
      sentryTags: payload.tags ?? {},
      fingerprint: payload.fingerprint ?? [],
    },
  };

  return processBreachSignal(signal);
}

// ============================================================================
// Sentry payload type — minimal shape
// ============================================================================

export interface SentryAlertPayload {
  /** Sentry event ID — duplicate guard için. */
  id?: string;
  /** Olay başlığı. */
  title?: string;
  /** Olay seviyesi (fatal/error/warning/info). */
  level?: string;
  /** Olay mesajı. */
  message?: string;
  /** Proje slug. */
  project?: string;
  /** Sentry UI URL. */
  url?: string;
  /** Tags (string → string map). */
  tags?: Record<string, string>;
  /** Event fingerprint (grouping). */
  fingerprint?: string[];
}

// ============================================================================
// Internal helpers
// ============================================================================

function severityToSentryLevel(severity: BreachSeverity): Sentry.SeverityLevel {
  switch (severity) {
    case 'CRITICAL':
      return 'fatal';
    case 'HIGH':
      return 'error';
    case 'MEDIUM':
      return 'warning';
    case 'LOW':
      return 'info';
  }
}

function sentryLevelToBreachSeverity(level?: string): BreachSeverity {
  switch ((level ?? '').toLowerCase()) {
    case 'fatal':
      return 'CRITICAL';
    case 'error':
      return 'HIGH';
    case 'warning':
      return 'MEDIUM';
    case 'info':
      return 'LOW';
    default:
      return 'MEDIUM';
  }
}

function extractDataCategoriesFromTags(
  tags?: Record<string, string>
): string[] | undefined {
  if (!tags) return undefined;
  const cats = tags.dataCategories ?? tags.data_categories;
  if (!cats) return undefined;
  return cats.split(',').map((s) => s.trim()).filter(Boolean);
}

/**
 * Workspace owner + ADMIN_EMAIL → recipients list.
 */
async function resolveBreachRecipients(workspaceOwnerId: string): Promise<string[]> {
  const recipients = new Set<string>();

  // Workspace owner
  try {
    const owner = await prisma.user.findUnique({
      where: { id: workspaceOwnerId },
      select: { email: true },
    });
    if (owner?.email) recipients.add(owner.email);
  } catch {
    /* owner email resolve fail — sessizce devam */
  }

  // ADMIN_EMAIL env fallback
  const adminEmail = process.env.ADMIN_EMAIL?.trim();
  if (adminEmail) recipients.add(adminEmail);

  // SECURITY_EMAIL — data breach için özel mail kanalı (varsa)
  const securityEmail = process.env.SECURITY_EMAIL?.trim();
  if (securityEmail) recipients.add(securityEmail);

  return Array.from(recipients);
}

function renderBreachEmailHtml(args: {
  title: string;
  description: string;
  severity: BreachSeverity;
  notifyKvkk: boolean;
  incidentId: string;
  workspaceName: string;
  detectedAt: Date;
  affectedUsers?: number;
  dataCategories?: string[];
}): string {
  const severityColor = {
    CRITICAL: '#dc2626',
    HIGH: '#ea580c',
    MEDIUM: '#ca8a04',
    LOW: '#65a30d',
  }[args.severity];

  return `<!DOCTYPE html>
<html><body style="font-family: -apple-system, sans-serif; padding: 32px; background: #f8fafc;">
  <div style="max-width: 600px; margin: 0 auto; background: white; padding: 32px; border-radius: 8px;">
    <div style="background: ${severityColor}; color: white; padding: 16px; border-radius: 4px; margin-bottom: 24px;">
      <h1 style="margin: 0; font-size: 20px;">DATA BREACH — ${args.severity}</h1>
    </div>

    <h2 style="margin-top: 0;">${escapeHtml(args.title)}</h2>

    <table style="width: 100%; font-size: 13px; margin: 16px 0;">
      <tr><td style="padding: 6px 0; color: #64748b;">Workspace</td><td style="padding: 6px 0;">${escapeHtml(args.workspaceName)}</td></tr>
      <tr><td style="padding: 6px 0; color: #64748b;">Incident ID</td><td style="padding: 6px 0; font-family: monospace;">${escapeHtml(args.incidentId)}</td></tr>
      <tr><td style="padding: 6px 0; color: #64748b;">Detected</td><td style="padding: 6px 0;">${args.detectedAt.toISOString()}</td></tr>
      ${args.affectedUsers ? `<tr><td style="padding: 6px 0; color: #64748b;">Affected Users</td><td style="padding: 6px 0;">${args.affectedUsers}</td></tr>` : ''}
      ${args.dataCategories && args.dataCategories.length > 0 ? `<tr><td style="padding: 6px 0; color: #64748b;">Data Categories</td><td style="padding: 6px 0;">${args.dataCategories.map(escapeHtml).join(', ')}</td></tr>` : ''}
      ${args.notifyKvkk ? `<tr><td style="padding: 6px 0; color: #64748b;">KVKK Notification</td><td style="padding: 6px 0; color: ${severityColor}; font-weight: 700;">REQUIRED (72 saat)</td></tr>` : ''}
    </table>

    <h3>Description</h3>
    <p style="line-height: 1.5;">${escapeHtml(args.description).replace(/\n/g, '<br/>')}</p>

    <hr style="margin: 24px 0; border: none; border-top: 1px solid #e2e8f0;" />

    <p style="font-size: 11px; color: #64748b;">
      Generated by Noktanyus Compliance Tracker. This is an automated breach notification.
    </p>
  </div>
</body></html>`;
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ============================================================================
// L8 — VERBİS otomatik submission
// ============================================================================

/**
 * Severity'ye göre VERBİS auto-submit kararı:
 *   - CRITICAL → auto-submit + notify + Sentry
 *   - HIGH     → auto-submit + notify
 *   - MEDIUM   → notify + manual submission flag
 *   - LOW      → log only
 */
export async function maybeAutoSubmitToVerbis(
  incidentId: string
): Promise<{
  submitted: boolean;
  skipped: boolean;
  result?: VerbisSubmissionResult;
  reason?: string;
}> {
  const incident = await prisma.dataBreachIncident.findUnique({
    where: { id: incidentId },
    include: {
      workspace: { select: { id: true, name: true, ownerId: true } },
      site: { select: { contactEmail: true } },
    },
  });
  if (!incident) {
    return { submitted: false, skipped: true, reason: 'INCIDENT_NOT_FOUND' };
  }
  if (incident.verbisSubmittedAt) {
    return { submitted: true, skipped: true, reason: 'ALREADY_SUBMITTED' };
  }
  if (incident.severity === 'LOW') {
    logger.info('[breach-detector] LOW severity — VERBİS submission skipped', { incidentId });
    return { submitted: false, skipped: true, reason: 'LOW_SEVERITY' };
  }
  if (incident.severity === 'MEDIUM') {
    logger.info('[breach-detector] MEDIUM severity — manual submission flag', { incidentId });
    return { submitted: false, skipped: true, reason: 'MEDIUM_REQUIRES_MANUAL' };
  }
  if (!isVerbisConfigured()) {
    logger.warn('[breach-detector] VERBİS yapılandırılmamış — submission atlanıyor', { incidentId });
    return { submitted: false, skipped: true, reason: 'VERBIS_NOT_CONFIGURED' };
  }

  // Workspace owner email — iletişim için
  let contactEmail: string | undefined = incident.site?.contactEmail ?? undefined;
  if (!contactEmail) {
    const owner = await prisma.user.findUnique({
      where: { id: incident.workspace.ownerId },
      select: { email: true },
    });
    contactEmail = owner?.email ?? undefined;
  }

  const detectedAt = incident.detectedAt;
  const deadline = incident.kvkkMadde12Deadline ?? computeMadde12Deadline(detectedAt);

  const payload: VerbisBreachNotificationPayload = {
    workspaceId: incident.workspaceId,
    severity: incident.severity as VerbisBreachNotificationPayload['severity'],
    title: incident.title,
    description: incident.description,
    affectedUsers: incident.affectedUsers ?? 0,
    detectedAt,
    deadline,
    dataCategories: Array.isArray(incident.dataCategories)
      ? (incident.dataCategories as string[])
      : undefined,
    contactEmail,
    incidentId: incident.id,
  };

  const result = await submitBreachNotification(payload);

  // DB güncelle
  await prisma.dataBreachIncident.update({
    where: { id: incident.id },
    data: {
      verbisNotificationId: result.notificationId || null,
      verbisSubmittedAt: result.status === 'FAILED' ? null : new Date(),
      verbisStatus: result.status,
    },
  });

  await logAudit({
    action: 'CREATE',
    resource: 'DataBreachIncident',
    resourceId: incident.id,
    details: {
      action: 'verbis_auto_submit',
      severity: incident.severity,
      verbisNotificationId: result.notificationId,
      verbisStatus: result.status,
      error: result.error,
    },
  });

  return {
    submitted: result.status !== 'FAILED',
    skipped: false,
    result,
    reason: result.error,
  };
}

// ============================================================================
// L8 — Etkilenen kullanıcılara aydınlatma bildirimi
// ============================================================================

export interface NotifyAffectedUsersResult {
  workspaceId: string;
  breachId: string;
  notified: number;
  skipped: number;
  failed: number;
}

/**
 * Workspace'in tüm üyelerine KVKK Madde 12 aydınlatma email'i gönderir.
 * Dil: workspace locale ya da default TR.
 */
export async function notifyAffectedUsers(
  workspaceId: string,
  breachId: string,
  options: { locale?: 'tr' | 'en' } = {}
): Promise<NotifyAffectedUsersResult> {
  const locale = options.locale ?? 'tr';

  const incident = await prisma.dataBreachIncident.findFirst({
    where: { id: breachId, workspaceId },
    include: {
      workspace: { select: { id: true, name: true, ownerId: true } },
    },
  });
  if (!incident) {
    throw new Error('Breach incident bulunamadı');
  }

  // Tüm workspace üyelerini çek (owner dahil)
  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId },
    include: { user: { select: { email: true, name: true } } },
  });

  // Owner her zaman dahil (WorkspaceMember tablosunda görünmeyebilir)
  const owner = await prisma.user.findUnique({
    where: { id: incident.workspace.ownerId },
    select: { email: true, name: true },
  });

  // Email listesi unique
  const recipientMap = new Map<string, { email: string; name?: string | null }>();
  for (const m of members) {
    if (m.user?.email) {
      recipientMap.set(m.user.email, { email: m.user.email, name: m.user.name });
    }
    if (m.userEmail && !recipientMap.has(m.userEmail)) {
      recipientMap.set(m.userEmail, { email: m.userEmail, name: m.userName });
    }
  }
  if (owner?.email && !recipientMap.has(owner.email)) {
    recipientMap.set(owner.email, { email: owner.email, name: owner.name });
  }

  const recipients = Array.from(recipientMap.values());
  if (recipients.length === 0) {
    return { workspaceId, breachId, notified: 0, skipped: 0, failed: 0 };
  }

  const dashboardUrl = `${process.env.NEXTAUTH_URL ?? 'http://localhost:3000'}/dashboard/compliance/incidents/${breachId}`;

  let notified = 0;
  let failed = 0;
  let skipped = 0;

  // Rate-limit friendly: küçük batch'ler halinde gönder
  const BATCH = 10;
  for (let i = 0; i < recipients.length; i += BATCH) {
    const batch = recipients.slice(i, i + BATCH);
    const results = await Promise.allSettled(
      batch.map(async (r) => {
        const subject =
          locale === 'tr'
            ? `[Veri İhlali] ${incident.workspace.name} — ${incident.title}`
            : `[Data Breach] ${incident.workspace.name} — ${incident.title}`;
        const text =
          locale === 'tr'
            ? `Sayın ${r.name ?? 'kullanıcı'},\n\n${incident.workspace.name} bünyesinde bir veri ihlali tespit edilmiştir. Detaylar için: ${dashboardUrl}\n\nOlay No: ${breachId}\nTespit: ${incident.detectedAt.toISOString()}`
            : `Dear ${r.name ?? 'user'},\n\nA data breach has been detected within ${incident.workspace.name}. For details: ${dashboardUrl}\n\nIncident: ${breachId}\nDetected: ${incident.detectedAt.toISOString()}`;

        const sendResult = await sendEmail({
          to: r.email,
          subject,
          html: renderMadde12EmailHtml({
            locale,
            recipientName: r.name ?? undefined,
            workspaceName: incident.workspace.name,
            breachTitle: incident.title,
            breachDescription: incident.description,
            detectedAt: incident.detectedAt,
            incidentId: breachId,
            affectedDataCategories: Array.isArray(incident.dataCategories)
              ? (incident.dataCategories as string[])
              : undefined,
            contactEmail: r.email,
            incidentUrl: dashboardUrl,
          }),
          text,
        });
        return sendResult.success;
      })
    );

    for (const r of results) {
      if (r.status === 'fulfilled') {
        if (r.value) notified++;
        else failed++;
      } else {
        failed++;
      }
    }
    // Kalan batch yoksa skipped hesabı yapma
    if (i + BATCH >= recipients.length) break;
  }

  // notifiedAt güncelle
  await prisma.dataBreachIncident.update({
    where: { id: breachId },
    data: { affectedUsersNotifiedAt: new Date() },
  });

  await logAudit({
    action: 'CREATE',
    resource: 'DataBreachIncident',
    resourceId: breachId,
    details: {
      action: 'notify_affected_users',
      workspaceId,
      recipients: recipients.length,
      notified,
      failed,
      locale,
    },
  });

  return { workspaceId, breachId, notified, skipped, failed };
}

// ============================================================================
// L8 — Inline email HTML renderer (React Email component'ine gerek kalmadan)
// ============================================================================

function renderMadde12EmailHtml(args: {
  locale: 'tr' | 'en';
  recipientName?: string;
  workspaceName: string;
  breachTitle: string;
  breachDescription: string;
  detectedAt: Date;
  incidentId: string;
  affectedDataCategories?: string[];
  contactEmail: string;
  incidentUrl: string;
}): string {
  const isTr = args.locale === 'tr';
  return `<!DOCTYPE html>
<html><body style="font-family: -apple-system, sans-serif; padding: 32px; background: #f8fafc;">
  <div style="max-width: 600px; margin: 0 auto; background: white; padding: 32px; border-radius: 8px;">
    <div style="background: #dc2626; color: white; padding: 16px; border-radius: 4px; margin-bottom: 24px;">
      <h1 style="margin: 0; font-size: 18px;">${isTr ? 'VERİ İHLALİ BİLDİRİMİ' : 'DATA BREACH NOTIFICATION'}</h1>
    </div>

    <p>${isTr ? 'Sayın' : 'Dear'} ${escapeHtml(args.recipientName ?? 'kullanıcı')},</p>

    <p>${isTr
      ? `6698 sayılı KVKK'nın 12. maddesi kapsamında, <strong>${escapeHtml(args.workspaceName)}</strong> bünyesinde gerçekleşen bir veri ihlalini sizinle paylaşıyoruz.`
      : `In compliance with Article 12 of the Personal Data Protection Law (KVKK) No. 6698, we are notifying you of a data breach within <strong>${escapeHtml(args.workspaceName)}</strong>.`
    }</p>

    <h2 style="color: #0f172a;">${escapeHtml(args.breachTitle)}</h2>
    <p style="line-height: 1.6;">${escapeHtml(args.breachDescription)}</p>

    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />

    <table style="width: 100%; font-size: 13px;">
      <tr><td style="padding: 6px 0; color: #64748b;">${isTr ? 'Veri Sorumlusu' : 'Data Controller'}</td><td>${escapeHtml(args.workspaceName)}</td></tr>
      <tr><td style="padding: 6px 0; color: #64748b;">${isTr ? 'Tespit Tarihi' : 'Detected At'}</td><td>${args.detectedAt.toISOString()}</td></tr>
      <tr><td style="padding: 6px 0; color: #64748b;">${isTr ? 'Olay No' : 'Incident ID'}</td><td style="font-family: monospace; font-size: 12px;">${escapeHtml(args.incidentId)}</td></tr>
      ${args.affectedDataCategories && args.affectedDataCategories.length > 0
        ? `<tr><td style="padding: 6px 0; color: #64748b;">${isTr ? 'Etkilenen Veriler' : 'Affected Data'}</td><td>${args.affectedDataCategories.map(escapeHtml).join(', ')}</td></tr>`
        : ''}
      <tr><td style="padding: 6px 0; color: #64748b;">${isTr ? 'İletişim' : 'Contact'}</td><td>${escapeHtml(args.contactEmail)}</td></tr>
    </table>

    <h3 style="font-size: 14px; margin-top: 24px;">${isTr ? 'KVKK Madde 11 Kapsamındaki Haklarınız' : 'Your Rights (KVKK Art. 11)'}</h3>
    <ul style="font-size: 13px; line-height: 1.6; color: #334155;">
      ${(isTr
        ? [
            'Kişisel verilerinizin işlenip işlenmediğini öğrenme',
            'İşlenmişse buna ilişkin bilgi talep etme',
            'Eksik/yanlış işlenen verilerin düzeltilmesini isteme',
            'Şartlar oluştuğunda silinmesini/yok edilmesini isteme',
          ]
        : [
            'Learn whether your personal data is processed',
            'Request information about processing',
            'Request correction of incomplete/incorrect data',
            'Request deletion/destruction under applicable conditions',
          ]
      )
        .map((r) => `<li>${r}</li>`)
        .join('')}
    </ul>

    <p style="text-align: center; margin: 32px 0 16px;">
      <a href="${args.incidentUrl}" style="background: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: 600;">
        ${isTr ? 'İhlal Detayını Görüntüle' : 'View Incident Details'}
      </a>
    </p>

    <p style="font-size: 11px; color: #64748b; text-align: center;">
      ${isTr
        ? 'Bu e-posta KVKK Madde 12 aydınlatma yükümlülüğü kapsamında gönderilmiştir.'
        : 'This email is sent in compliance with Article 12 of the KVKK.'}
    </p>
  </div>
</body></html>`;
}

// ============================================================================
// L8 — Auto-escalation
// ============================================================================

/**
 * 60 saat mark'ında henüz VERBİS'e gönderilmemiş HIGH/CRITICAL
 * incident'lar için otomatik escalation tetikler.
 */
export async function processCheckBreaches(): Promise<{
  processedCount: number;
  escalatedCount: number;
  remindersCount: number;
  errors: Array<{ incidentId: string; reason: string }>;
}> {
  const now = new Date();
  const SIXTY_HOURS_AGO = new Date(now.getTime() - 60 * 60 * 60 * 1000);
  const FORTY_EIGHT_HOURS_FROM_NOW = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  // 1. Auto-escalate: detectedAt > 60h ago, severity HIGH/CRITICAL, not submitted
  const escalatable = await prisma.dataBreachIncident.findMany({
    where: {
      severity: { in: ['HIGH', 'CRITICAL'] },
      verbisSubmittedAt: null,
      escalatedToVerbis: false,
      detectedAt: { lte: SIXTY_HOURS_AGO },
    },
    select: { id: true, workspaceId: true, severity: true, title: true },
    take: 50,
  });

  let escalatedCount = 0;
  const errors: Array<{ incidentId: string; reason: string }> = [];

  for (const incident of escalatable) {
    try {
      const result = await maybeAutoSubmitToVerbis(incident.id);
      if (result.submitted) {
        await prisma.dataBreachIncident.update({
          where: { id: incident.id },
          data: { escalatedToVerbis: true },
        });
        escalatedCount++;
      }
    } catch (err) {
      errors.push({
        incidentId: incident.id,
        reason: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // 2. Deadline reminders: 24h kala (notification scheduled for reminder job)
  // Burada sadece DB flag'ini güncelliyoruz; notification gönderimi queue üzerinden.
  const upcomingDeadlines = await prisma.dataBreachIncident.findMany({
    where: {
      affectedUsersNotifiedAt: null,
      kvkkMadde12Deadline: {
        lte: FORTY_EIGHT_HOURS_FROM_NOW,
        gte: now,
      },
    },
    select: { id: true, workspaceId: true, severity: true },
    take: 50,
  });

  return {
    processedCount: escalatable.length + upcomingDeadlines.length,
    escalatedCount,
    remindersCount: upcomingDeadlines.length,
    errors,
  };
}