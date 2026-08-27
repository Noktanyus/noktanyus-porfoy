/**
 * POST /api/admin/newsletter/broadcast
 *
 * Admin tüm doğrulanmış + aktif abonelere broadcast email gönderir.
 * Auth: getServerSession + role=admin kontrolü.
 * Rate limit: adminApi (60 req/min).
 *
 * Body: { subject, html, text? }
 * Response: { success: true, data: { sent, failed, total, queued } }
 *
 * REDIS_URL tanımlıysa gönderim kuyruğa alınır (queued > 0, sent/failed = 0).
 * Aksi halde senkron gönderilir (sent/failed dolu, queued = 0).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { newsletterService } from '@/modules/newsletter';
import { queueService } from '@/lib/queueService';
import { BroadcastSchema } from '@/modules/newsletter/schemas';
import { ok, withErrorHandling } from '@/lib/apiResponse';
import { withRateLimit } from '@/lib/rateLimitMiddleware';
import { RateLimits } from '@/lib/rateLimit';
import { logger } from '@/lib/logger';
import { logAudit } from '@/lib/audit';

export const POST = withRateLimit(RateLimits.adminApi, async (req: NextRequest) => {
  // 1. Auth (dışarıda — withErrorHandling tip sorunlarından kaçınmak için)
  const session = await getServerSession(authOptions);
  const sessionUser = session?.user;
  if (!sessionUser) {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Giriş gerekli' },
      },
      { status: 401 }
    );
  }

  const userRole = (sessionUser as { role?: string }).role;
  if (userRole !== 'admin') {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'FORBIDDEN', message: 'Admin yetkisi gerekli' },
      },
      { status: 403 }
    );
  }

  // 2. İş mantığı + hata yönetimi
  return withErrorHandling(async () => {
    const body = await req.json();
    const data = BroadcastSchema.parse(body);

    logger.info('Newsletter broadcast starting', {
      subject: data.subject,
      by: sessionUser.email,
      driver: queueService.driver,
    });

    // BullMQ aktifse kuyruğa al ve hemen dön — admin request'i abone
    // sayısı kadar beklemez, retry per-abone çalışır. Redis yoksa
    // in-memory queue serverless'ta güvenilir olmadığı için senkron gönderilir.
    const result =
      queueService.driver === 'bullmq'
        ? { sent: 0, failed: 0, ...(await newsletterService.enqueueBroadcast(data)) }
        : { queued: 0, ...(await newsletterService.sendBroadcast(data)) };

    logger.info('Newsletter broadcast done', {
      ...result,
      by: sessionUser.email,
    });

    // Audit log (best-effort — broadcast bir "EXPORT" benzeri toplu işlem)
    try {
      const ipAddress =
        req.headers.get('x-audit-ip') ||
        req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        req.headers.get('x-real-ip') ||
        undefined;
      const userAgent =
        req.headers.get('x-audit-ua') || req.headers.get('user-agent') || undefined;

      await logAudit({
        userEmail: sessionUser.email ?? undefined,
        action: 'EXPORT',
        resource: 'newsletter',
        resourceId: data.subject,
        details: {
          type: 'broadcast',
          sent: result.sent,
          failed: result.failed,
          total: result.total,
          queued: result.queued,
        },
        ipAddress,
        userAgent,
      });
    } catch (err) {
      logger.warn('Broadcast audit log failed', {
        error: err instanceof Error ? err.message : 'unknown',
      });
    }

    return ok(result);
  });
});