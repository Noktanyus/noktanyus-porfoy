/**
 * AI Bulk Generation — Export Results CSV (Phase 2 A.2)
 *
 * GET /api/ai/bulk/jobs/[jobId]/export?workspaceId=...
 *   → Sonuçları CSV olarak R2/local'e yazar, public URL döner
 *   Response: { success, data: { downloadUrl } }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';
import { withRateLimit } from '@/lib/rateLimitMiddleware';
import { RateLimits } from '@/lib/rateLimit';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { exportResultsCsv } from '@/modules/ai-bulk/service';

export const GET = withRateLimit(RateLimits.api, async (
  req: NextRequest,
  { params }: { params: { jobId: string } }
) => {
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

    // Workspace sahiplik kontrolü
    const job = await prisma.generationJob.findFirst({
      where: { id: params.jobId, workspaceId },
      select: { id: true, outputCsvPath: true },
    });
    if (!job) {
      return fail({ code: 'NOT_FOUND', message: 'Job bulunamadı', statusCode: 404 });
    }

    // Daha önce export edilmişse cache'lenmiş URL'i dön (maliyet optimizasyonu)
    if (job.outputCsvPath) {
      return ok({ downloadUrl: job.outputCsvPath, cached: true }) as NextResponse;
    }

    try {
      const downloadUrl = await exportResultsCsv(params.jobId);
      return ok({ downloadUrl, cached: false }) as NextResponse;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Export başarısız';
      logger.error('[ai-bulk] export failed', { jobId: params.jobId, error: msg });
      return fail({ code: 'EXPORT_FAILED', message: msg, statusCode: 500 });
    }
  });
});

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
