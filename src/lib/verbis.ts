/**
 * VERBİS API Client (L8 / Phase Async/Compliance)
 *
 * KVKK Kurumu'nun online VERBİS (Veri Sorumluları Sicil Bilgi Sistemi) ile
 * data breach bildirimi submission'ı için HMAC-signed HTTP istemcisi.
 *
 * Akış:
 *   1. submitBreachNotification() → /breach-notifications endpoint
 *   2. getBreachNotificationStatus(notificationId) → /breach-notifications/{id}
 *   3. notifyAffectedUsersMadde12() → etkilenen kullanıcılara aydınlatma
 *
 * Yapılandırma:
 *   - VERBIS_API_URL: VERBİS base URL (örn: https://verbis.kvkk.gov.tr/api/v1)
 *   - VERBIS_API_KEY: public API anahtarı (HMAC için kullanılır)
 *   - VERBIS_API_SECRET: HMAC signing secret
 *
 * Production'da VERBİS'in gerçek API kontratı açıklandığında uç noktalar
 * güncellenecek. Şu an generic REST pattern kullanıyoruz.
 */

import crypto from 'node:crypto';
import { logger } from './logger';

// ============================================================================
// Yapılandırma
// ============================================================================

const VERBIS_TIMEOUT_MS = Number(process.env.VERBIS_TIMEOUT_MS ?? '15000');

/**
 * VERBİS API yapılandırılmış mı? Prod ortamda true olmalı.
 * Her çağrıda process.env'i okur — test setup'ta env değişiklikleri geçerli olur.
 */
export function isVerbisConfigured(): boolean {
  const url = process.env.VERBIS_API_URL?.trim() ?? '';
  const key = process.env.VERBIS_API_KEY?.trim() ?? '';
  const secret = process.env.VERBIS_API_SECRET?.trim() ?? '';
  return Boolean(url && key && secret);
}

/**
 * Internal helper — VERBİS env değerlerini çağrı anında okur.
 * Module-level const'lar test setup'ında değişiklik yansımaz; bu yüzden
 * helper'lar her seferinde process.env'e bakar.
 */
function getVerbisConfig() {
  return {
    url: process.env.VERBIS_API_URL?.trim() ?? '',
    key: process.env.VERBIS_API_KEY?.trim() ?? '',
    secret: process.env.VERBIS_API_SECRET?.trim() ?? '',
  };
}

// ============================================================================
// Tipler
// ============================================================================

export type VerbisStatus = 'SUBMITTED' | 'PENDING' | 'FAILED' | 'ACKNOWLEDGED';

export interface VerbisBreachNotificationPayload {
  workspaceId: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
  affectedUsers: number;
  detectedAt: Date;
  /** KVKK Madde 12: 72 saat deadline (detectedAt + 72h) */
  deadline: Date;
  /** Etkilenen veri kategorileri */
  dataCategories?: string[];
  /** Workspace contact email */
  contactEmail?: string;
  /** Incident ID (our internal) */
  incidentId: string;
}

export interface VerbisSubmissionResult {
  notificationId: string;
  status: VerbisStatus;
  submittedAt: Date;
  responsePayload?: unknown;
  error?: string;
}

export interface VerbisStatusResult {
  notificationId: string;
  status: VerbisStatus;
  updatedAt: Date;
  responsePayload?: unknown;
}

// ============================================================================
// HMAC signature
// ============================================================================

/**
 * Request body için HMAC-SHA256 imzası üretir.
 * Header: X-Verbis-Signature: sha256=<hex>
 */
function signRequest(body: string): string {
  const secret = process.env.VERBIS_API_SECRET?.trim() ?? '';
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(body, 'utf-8');
  return `sha256=${hmac.digest('hex')}`;
}

// ============================================================================
// HTTP helper
// ============================================================================

async function verbisFetch<T>(path: string, init: RequestInit): Promise<{
  ok: boolean;
  status: number;
  data: T | null;
  error?: string;
}> {
  if (!isVerbisConfigured()) {
    return {
      ok: false,
      status: 503,
      data: null,
      error: 'VERBIS_NOT_CONFIGURED',
    };
  }

  const cfg = getVerbisConfig();
  const url = `${cfg.url.replace(/\/$/, '')}${path}`;
  const body = init.body ?? '';
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), VERBIS_TIMEOUT_MS);

  try {
    const resp = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'X-Verbis-Api-Key': cfg.key,
        'X-Verbis-Signature': signRequest(typeof body === 'string' ? body : ''),
        Accept: 'application/json',
        ...(init.headers ?? {}),
      },
    });
    clearTimeout(timeoutId);

    const text = await resp.text();
    let data: T | null = null;
    try {
      data = text ? (JSON.parse(text) as T) : null;
    } catch {
      data = null;
    }

    if (!resp.ok) {
      return {
        ok: false,
        status: resp.status,
        data,
        error: `HTTP ${resp.status}`,
      };
    }
    return { ok: true, status: resp.status, data };
  } catch (err) {
    clearTimeout(timeoutId);
    const msg = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      status: 0,
      data: null,
      error: msg,
    };
  }
}

// ============================================================================
// submitBreachNotification
// ============================================================================

/**
 * KVKK Kurumu VERBİS sistemine breach bildirimi gönderir.
 *
 * NOT: VERBİS'in gerçek public API kontratı KVKK tarafından açıklandığında
 * uç nokta ve payload shape güncellenecek. Şu an generic REST pattern'i
 * kullanıyoruz (POST /breach-notifications).
 */
export async function submitBreachNotification(
  payload: VerbisBreachNotificationPayload
): Promise<VerbisSubmissionResult> {
  if (!isVerbisConfigured()) {
    logger.warn('[verbis] VERBİS yapılandırılmamış, submission atlanıyor', {
      incidentId: payload.incidentId,
    });
    return {
      notificationId: '',
      status: 'FAILED',
      submittedAt: new Date(),
      error: 'VERBIS_NOT_CONFIGURED',
    };
  }

  const body = JSON.stringify({
    external_incident_id: payload.incidentId,
    severity: payload.severity,
    title: payload.title,
    description: payload.description,
    affected_users: payload.affectedUsers,
    detected_at: payload.detectedAt.toISOString(),
    kvkk_madde_12_deadline: payload.deadline.toISOString(),
    data_categories: payload.dataCategories ?? [],
    contact_email: payload.contactEmail ?? null,
    submitted_at: new Date().toISOString(),
  });

  const resp = await verbisFetch<{
    notification_id?: string;
    status?: string;
    [key: string]: unknown;
  }>('/breach-notifications', {
    method: 'POST',
    body,
  });

  const submittedAt = new Date();

  if (!resp.ok || !resp.data) {
    logger.error('[verbis] Submission failed', {
      incidentId: payload.incidentId,
      status: resp.status,
      error: resp.error,
    });
    return {
      notificationId: '',
      status: 'FAILED',
      submittedAt,
      error: resp.error,
      responsePayload: resp.data,
    };
  }

  const notificationId = String(resp.data.notification_id ?? '');
  const statusStr = String(resp.data.status ?? 'SUBMITTED').toUpperCase();
  const status: VerbisStatus =
    statusStr === 'PENDING' ||
    statusStr === 'ACKNOWLEDGED' ||
    statusStr === 'FAILED'
      ? (statusStr as VerbisStatus)
      : 'SUBMITTED';

  logger.info('[verbis] Submission successful', {
    incidentId: payload.incidentId,
    notificationId,
    status,
  });

  return {
    notificationId,
    status,
    submittedAt,
    responsePayload: resp.data,
  };
}

// ============================================================================
// getBreachNotificationStatus
// ============================================================================

/**
 * VERBİS'e gönderilen bildirimin güncel durumunu sorgular.
 * Polling için kullanılır (örn. her 6 saatte).
 */
export async function getBreachNotificationStatus(
  notificationId: string
): Promise<VerbisStatusResult> {
  const resp = await verbisFetch<{
    status?: string;
    updated_at?: string;
    [key: string]: unknown;
  }>(`/breach-notifications/${encodeURIComponent(notificationId)}`, {
    method: 'GET',
    body: '',
  });

  if (!resp.ok || !resp.data) {
    return {
      notificationId,
      status: 'PENDING',
      updatedAt: new Date(),
      responsePayload: resp.data ?? { error: resp.error },
    };
  }

  const statusStr = String(resp.data.status ?? 'PENDING').toUpperCase();
  const status: VerbisStatus =
    statusStr === 'SUBMITTED' ||
    statusStr === 'ACKNOWLEDGED' ||
    statusStr === 'FAILED'
      ? (statusStr as VerbisStatus)
      : 'PENDING';

  return {
    notificationId,
    status,
    updatedAt: resp.data.updated_at ? new Date(resp.data.updated_at) : new Date(),
    responsePayload: resp.data,
  };
}

// ============================================================================
// KVKK Madde 12 / 13 helpers
// ============================================================================

/**
 * KVKK Madde 12: aydınlatma yükümlülüğü — ilgili kişilere 72 saat içinde
 * bildirim. Bu helper, deadline hesaplar.
 */
export function computeMadde12Deadline(detectedAt: Date, hours = 72): Date {
  return new Date(detectedAt.getTime() + hours * 60 * 60 * 1000);
}

/**
 * KVKK Madde 13: Kurula bildirim. Madde 12 ile aynı deadline.
 */
export function computeMadde13Deadline(detectedAt: Date): Date {
  return computeMadde12Deadline(detectedAt);
}

/**
 * KVKK Madde 12 deadline yaklaşıyor mu? (default 24 saat kala)
 */
export function isDeadlineApproaching(
  deadline: Date,
  thresholdHours = 24
): boolean {
  const now = Date.now();
  const ms = deadline.getTime() - now;
  return ms > 0 && ms <= thresholdHours * 60 * 60 * 1000;
}

/**
 * Auto-escalation tetiklenmeli mi? (60 saat mark)
 */
export function shouldAutoEscalateToVerbis(
  detectedAt: Date,
  escalationHour = 60
): boolean {
  const elapsed = Date.now() - detectedAt.getTime();
  return elapsed >= escalationHour * 60 * 60 * 1000;
}
