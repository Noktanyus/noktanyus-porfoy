/**
 * AI Bulk Job — Manual Retry Endpoint (L4)
 *
 * POST /api/saas/ai/jobs/[jobId]/retry
 *   Body: { workspaceId: string }
 *   → Dead letter'daki tüm satırların retryCount'unu resetler ve tekrar
 *     kuyruğa ekler. Job status'unu pending'e çeker.
 *
 * Auth: giriş yapmış kullanıcı + workspace sahibi/admin olmalı.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';
import { withRateLimit } from '@/lib/rateLimitMiddleware';
import { RateLimits } from '@/lib/rateLimit';
import { prisma } from '@/lib/prisma';
import { manualRetryDeadLetter } from '@/modules/ai-bulk/service';
import { logAudit } from '@/lib/audit';

export const POST = withRateLimit(RateLimits.api, async (req: NextRequest) => {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return fail({ code: 'UNAUTHORIZED', message: 'Giriş gerekli', statusCode: 401 });
    }

    const jobId = req.url.split('/').filter(Boolean).pop()!;

    const body = await req.json().catch(() => ({}));
    const workspaceId: string | undefined = body.workspaceId;
    if (!workspaceId) {
      return fail({ code: 'MISSING_WORKSPACE', message: 'workspaceId gerekli', statusCode: 400 });
    }

    // Workspace erişim kontrolü
    const membership = await prisma.workspaceMember.findFirst({
      where: { workspaceId, userId: session.user.id, role: { in: ['OWNER', 'ADMIN'] } },
      select: { id: true },
    });
    if (!membership) {
      const ws = await prisma.workspace.findFirst({
        where: { id: workspaceId, ownerId: session.user.id },
        select: { id: true },
      });
      if (!ws) {
        return fail({ code: 'FORBIDDEN', message: 'Bu workspace\'e erişim yetkiniz yok', statusCode: 403 });
      }
    }

    try {
      const result = await manualRetryDeadLetter(jobId, workspaceId);

      await logAudit({
        action: 'UPDATE',
        resource: 'GenerationJob',
        resourceId: jobId,
        userId: session.user.id,
        userEmail: session.user.email ?? undefined,
        details: {
          workspaceId,
          retriedCount: result.retriedCount,
          action: 'manual_retry_dlq',
        },
      });

      return ok(result) as NextResponse;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('bulunamadı')) {
        return fail({ code: 'NOT_FOUND', message: msg, statusCode: 404 });
      }
      throw err;
    }
  });
});

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
