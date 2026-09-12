/**
 * AI Bulk Generation — Single Job API (Phase 2 A.2)
 *
 * GET /api/ai/bulk/jobs/[jobId]?workspaceId=...
 *   → getJobStatus — job + ilk 500 sonuç
 *
 * GET /api/ai/bulk/jobs/[jobId]/export?workspaceId=...
 *   → exportResultsCsv — sonuçları CSV olarak R2/local'e yazar, URL döner
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';
import { withRateLimit } from '@/lib/rateLimitMiddleware';
import { RateLimits } from '@/lib/rateLimit';
import { logger } from '@/lib/logger';
import { getJobStatus, exportResultsCsv } from '@/modules/ai-bulk/service';

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

    const job = await getJobStatus(params.jobId, workspaceId);
    if (!job) {
      return fail({ code: 'NOT_FOUND', message: 'Job bulunamadı', statusCode: 404 });
    }

    return ok(job) as NextResponse;
  });
});

// İkinci bir route dosyasına export için ayrı dosya kullanılacak (Next.js
// params davranışı için) — burada export endpoint'i tanımlanmaz.

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
