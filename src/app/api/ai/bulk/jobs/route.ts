/**
 * AI Bulk Generation — Jobs API (Phase 2 A.2)
 *
 * POST /api/ai/bulk/jobs
 *   Body: { workspaceId, csvPath, brandVoiceId?, language, length, keywords? }
 *   → startBulkGeneration çağırır, queue'ya AiBulkGenerate job ekler
 *   Response: { success, data: { jobId, totalRows, invalidRows } }
 *
 * GET /api/ai/bulk/jobs?workspaceId=...&page=1&pageSize=20&status=...
 *   → listJobs (pagination + filter)
 *   Response: { success, data: { items, total, page, pageSize } }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';
import { withRateLimit } from '@/lib/rateLimitMiddleware';
import { RateLimits } from '@/lib/rateLimit';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { BulkUploadSchema, ListJobsQuerySchema } from '@/modules/ai-bulk/schemas';
import { startBulkGeneration, listJobs } from '@/modules/ai-bulk/service';

const StartJobBodySchema = BulkUploadSchema.extend({
  workspaceId: z.string().min(1),
  csvOriginalName: z.string().max(300).optional(),
});

export const POST = withRateLimit(RateLimits.api, async (req: NextRequest) => {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return fail({ code: 'UNAUTHORIZED', message: 'Giriş gerekli', statusCode: 401 });
    }

    const body = await req.json();
    const parsed = StartJobBodySchema.safeParse(body);
    if (!parsed.success) {
      return fail({
        code: 'INVALID_INPUT',
        message: 'Geçersiz iş parametreleri',
        statusCode: 400,
        details: parsed.error.errors,
      });
    }

    const userId = (session.user as { id?: string }).id;
    if (!userId) {
      return fail({ code: 'UNAUTHORIZED', message: 'User id bulunamadı', statusCode: 401 });
    }

    try {
      const { workspaceId, csvOriginalName, ...input } = parsed.data;
      const result = await startBulkGeneration({
        workspaceId,
        userId,
        userEmail: session.user.email ?? undefined,
        input,
        csvOriginalName,
      });
      return ok(result, { status: 201 }) as NextResponse;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Bilinmeyen hata';
      const code = (err as { code?: string }).code;
      logger.error('[ai-bulk] startBulkGeneration failed', { error: msg, code });

      if (code === 'QUOTA_EXCEEDED') {
        return fail({ code: 'QUOTA_EXCEEDED', message: msg, statusCode: 402 });
      }
      return fail({ code: 'START_FAILED', message: msg, statusCode: 400 });
    }
  });
});

export const GET = withRateLimit(RateLimits.api, async (req: NextRequest) => {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return fail({ code: 'UNAUTHORIZED', message: 'Giriş gerekli', statusCode: 401 });
    }

    const url = new URL(req.url);
    const queryParsed = ListJobsQuerySchema.safeParse({
      page: url.searchParams.get('page') ?? undefined,
      pageSize: url.searchParams.get('pageSize') ?? undefined,
      status: url.searchParams.get('status') ?? undefined,
    });
    if (!queryParsed.success) {
      return fail({
        code: 'INVALID_QUERY',
        message: 'Geçersiz sorgu parametreleri',
        statusCode: 400,
        details: queryParsed.error.errors,
      });
    }

    const workspaceId = url.searchParams.get('workspaceId');
    if (!workspaceId) {
      return fail({ code: 'MISSING_WORKSPACE', message: 'workspaceId gerekli', statusCode: 400 });
    }

    const result = await listJobs({
      workspaceId,
      ...queryParsed.data,
    });

    return ok(result) as NextResponse;
  });
});

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
