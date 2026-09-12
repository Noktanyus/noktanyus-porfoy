/**
 * @file /api/webhooks/sentry-breach - Sentry alert → DataBreach incident webhook
 * @description POST: Sentry alert webhook'unu alır, Sentry signature'ı doğrular,
 *              payload'ı parse eder, BreachSignal oluşturur, processBreachSignal
 *              çağırır. Workspace ID Sentry alert tag'inde gelir ("workspaceId").
 *
 * Signature: Sentry-Hub-Signature header → HMAC-SHA256(body, SENTRY_WEBHOOK_SECRET)
 *
 * Auth: HMAC signature (Sentry client secret). Workspace ID payload içindedir.
 *
 * Body shape (Sentry webhook v2):
 *   { id, title, message, level, project, url, tags: {...}, fingerprint: [...] }
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';

import { logger } from '@/lib/logger';
import {
  handleSentryAlert,
  type SentryAlertPayload,
} from '@/modules/compliance/breachDetector';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const SENTRY_SIGNATURE_HEADER = 'sentry-hook-signature';
const SIGNATURE_TOLERANCE_MS = 5 * 60 * 1000; // 5 dakika — replay attack guard

export async function POST(req: NextRequest) {
  // Raw body oku (signature verification için text gerekli)
  const rawBody = await req.text();

  // 1. Signature verification
  const signatureValid = verifySentrySignature(req, rawBody);
  if (!signatureValid) {
    logger.warn('[sentry-webhook] Invalid signature');
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_SIGNATURE', message: 'Webhook signature invalid' } },
      { status: 401 }
    );
  }

  // 2. Payload parse
  let payload: SentryAlertPayload;
  try {
    payload = JSON.parse(rawBody) as SentryAlertPayload;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.warn('[sentry-webhook] JSON parse hatası', { error: message });
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_JSON', message: 'Payload JSON değil' } },
      { status: 400 }
    );
  }

  // 3. workspaceId tag'den al
  const workspaceId = payload.tags?.workspaceId;
  if (!workspaceId) {
    logger.warn('[sentry-webhook] workspaceId tag eksik', { tags: payload.tags });
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'WORKSPACE_ID_MISSING',
          message: "Payload'da 'workspaceId' tag'i zorunlu",
        },
      },
      { status: 400 }
    );
  }

  // 4. handleSentryAlert
  try {
    const result = await handleSentryAlert(workspaceId, payload);
    return NextResponse.json({ success: true, data: result }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const code = (err as Error & { code?: string }).code;
    const statusCode = code === 'WORKSPACE_NOT_FOUND' ? 404 : 500;
    logger.error('[sentry-webhook] handleSentryAlert hatası', {
      workspaceId,
      error: message,
      code,
    });
    return NextResponse.json(
      {
        success: false,
        error: { code: code ?? 'INTERNAL_ERROR', message },
      },
      { status: statusCode }
    );
  }
}

// ============================================================================
// Signature verification
// ============================================================================

/**
 * Sentry webhook signature doğrulaması:
 *   header: Sentry-Hub-Signature: <hex hmac>
 *   message: timestamp + "." + rawBody
 *   secret: SENTRY_WEBHOOK_SECRET env
 *
 * SENTRY_WEBHOOK_SECRET tanımlı değilse:
 *   - Development ortamında signature kontrolü atlanır (uyarı loglanır)
 *   - Production'da 503 döner (fail-closed)
 */
function verifySentrySignature(req: NextRequest, rawBody: string): boolean {
  const secret = process.env.SENTRY_WEBHOOK_SECRET?.trim();

  // Sentry bazen farklı header adları kullanır (sentry-hook-signature, sentry-hub-signature)
  const signature =
    req.headers.get(SENTRY_SIGNATURE_HEADER) ??
    req.headers.get('sentry-hub-signature') ??
    '';

  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      logger.error('[sentry-webhook] SENTRY_WEBHOOK_SECRET tanımsız (production)');
      return false;
    }
    logger.warn(
      '[sentry-webhook] SENTRY_WEBHOOK_SECRET tanımsız — development ortamında signature atlanıyor'
    );
    return true;
  }

  if (!signature) {
    return false;
  }

  // Sentry bazen "sha256=<hex>" formatında gönderir
  const cleanSignature = signature.replace(/^sha256=/, '').trim().toLowerCase();
  if (!cleanSignature) return false;

  // Sentry format: "<timestamp>=<hex hmac>" veya sadece hex
  const [timestampPart, hashPart] = cleanSignature.split('=');
  const receivedHash = hashPart ?? timestampPart;

  // Timestamp tolerance (replay attack guard)
  if (hashPart && timestampPart) {
    const ts = Number(timestampPart);
    if (Number.isFinite(ts)) {
      const now = Date.now() / 1000; // Sentry saniye kullanır
      if (Math.abs(now - ts) > SIGNATURE_TOLERANCE_MS / 1000) {
        logger.warn('[sentry-webhook] Timestamp tolerance aşıldı', {
          timestamp: ts,
          now,
        });
        return false;
      }
    }
  }

  // HMAC-SHA256(rawBody, secret) → hex
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');

  // Constant-time comparison
  try {
    return crypto.timingSafeEqual(
      Buffer.from(receivedHash, 'hex'),
      Buffer.from(expected, 'hex')
    );
  } catch {
    // hex decode hatası → invalid format
    return false;
  }
}