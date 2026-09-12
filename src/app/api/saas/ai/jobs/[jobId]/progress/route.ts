/**
 * AI Bulk Job — Real-time Progress Endpoint (L4)
 *
 * GET /api/saas/ai/jobs/[jobId]/progress?workspaceId=...
 *   → Real-time job ilerleme durumu:
 *     { processedRows, successfulRows, failedRows, retriedRows,
 *       deadLetterRows, remainingRows, etaSeconds, status, ... }
 *
 * Polling endpoint olarak çalışır (client her 2-5s çağırır). SSE upgrade
 * opsiyonel — şu an JSON dönüyoruz.
 *
 * Auth: giriş yapmış kullanıcı + workspace üyesi.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';
import { withRateLimit } from '@/lib/rateLimitMiddleware';
import { RateLimits } from '@/lib/rateLimit';
import { prisma } from '@/lib/prisma';
import { getJobProgress } from '@/modules/ai-bulk/service';

export const GET = withRateLimit(RateLimits.api, async (req: NextRequest) => {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return fail({ code: 'UNAUTHORIZED', message: 'Giriş gerekli', statusCode: 401 });
    }

    const url = new URL(req.url);
    const workspaceId = url.searchParams.get('workspaceId');
    if (!workspaceId) {
      return fail({ code: 'MISSING_WORKSPACE', message: 'workspaceId gerekli', statusCode: 400 });
    }

    const jobId = url.pathname.split('/').filter(Boolean).pop()!;

    // Workspace üyeliği kontrolü (sahibi veya üyesi)
    const member = await prisma.workspaceMember.findFirst({
      where: { workspaceId, userId: session.user.id },
      select: { id: true },
    });
    if (!member) {
      const ws = await prisma.workspace.findFirst({
        where: { id: workspaceId, ownerId: session.user.id },
        select: { id: true },
      });
      if (!ws) {
        return fail({ code: 'FORBIDDEN', message: 'Bu workspace\'e erişim yetkiniz yok', statusCode: 403 });
      }
    }

    const progress = await getJobProgress(jobId, workspaceId);
    if (!progress) {
      return fail({ code: 'NOT_FOUND', message: 'Job bulunamadı', statusCode: 404 });
    }

    return ok(progress) as NextResponse;
  });
});

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
