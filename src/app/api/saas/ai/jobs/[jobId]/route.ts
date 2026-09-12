/**
 * @file /api/saas/ai/jobs/[jobId] - SaaS API: GenerationJob durumu
 * @description GET: API key ile job durumunu ve ilk N sonucu getirir.
 *              Auth: withApiKey (workspace üyeliği zorunlu — job workspace'i üzerinden)
 *
 *              Query params:
 *                - limit (default 50, max 500)
 *
 *              Response:
 *                {
 *                  success: true,
 *                  data: {
 *                    jobId, status, totalRows, processedRows, successfulRows,
 *                    failedRows, createdAt, startedAt, completedAt,
 *                    options, brandVoice, results: [...]
 *                  }
 *                }
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withApiKey } from '@/lib/apiKeyMiddleware';
import { ensureSaasScope } from '@/lib/saasScopes';
import { getJobWorkspaceIfOwned } from '@/lib/saasWorkspace';
import { aiBulkService } from '@/modules/ai-bulk/service';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const QuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(500).default(50),
});

export const GET = withApiKey(async (req: NextRequest, ctx) => {
  // Scope kontrolü — read veya bulk:write (admin de geçer)
  const scopeError = ensureSaasScope(ctx.scopes, ['ai:describe:read', 'ai:bulk:write']);
  if (scopeError) return scopeError;

  const url = new URL(req.url);
  const params = QuerySchema.safeParse({
    limit: url.searchParams.get('limit') ?? undefined,
  });
  if (!params.success) {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Geçersiz query parametreleri' },
      },
      { status: 400 }
    );
  }

  const jobId = req.nextUrl.pathname.split('/').filter(Boolean).pop()!;

  // 1. Workspace sahiplik kontrolü (user → workspace member)
  const owned = await getJobWorkspaceIfOwned(jobId, ctx.userId);
  if (!owned) {
    // Job yok veya user workspace'e üye değil → 404 (bilgi sızdırma)
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Job bulunamadı' } },
      { status: 404 }
    );
  }

  // 2. Job detayını getir (limit kadar sonuçla)
  const job = await aiBulkService.getJobStatus(jobId, owned.workspaceId);
  if (!job) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Job bulunamadı' } },
      { status: 404 }
    );
  }

  // 3. Sonuçları limit'e göre kırp (zaten service take 500 yapıyor; ek kırpma)
  const results = job.results.slice(0, params.data.limit);

  logger.info('[saas/ai/jobs/get] Job fetched', {
    keyId: ctx.keyId,
    jobId,
    status: job.status,
    resultCount: results.length,
  });

  return NextResponse.json({
    success: true,
    data: {
      jobId: job.id,
      workspaceId: job.workspaceId,
      status: job.status,
      totalRows: job.totalRows,
      processedRows: job.processedRows,
      successfulRows: job.successfulRows,
      failedRows: job.failedRows,
      options: job.options,
      brandVoice: job.brandVoice
        ? { id: job.brandVoice.id, name: job.brandVoice.name }
        : null,
      csvOriginalName: job.csvOriginalName,
      outputCsvPath: job.outputCsvPath,
      createdAt: job.createdAt,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      errorMessage: job.errorMessage,
      results: results.map((r) => ({
        rowIndex: r.rowIndex,
        inputTitle: r.inputTitle,
        inputFeatures: r.inputFeatures,
        shortDescription: r.shortDescription,
        description: r.description,
        tags: r.tags,
        inputTokens: r.inputTokens,
        outputTokens: r.outputTokens,
        costCents: r.costCents,
        model: r.model,
        errorMessage: r.errorMessage,
        createdAt: r.createdAt,
      })),
      meta: {
        returnedResults: results.length,
        totalResults: job.results.length,
        limit: params.data.limit,
      },
    },
  });
});
