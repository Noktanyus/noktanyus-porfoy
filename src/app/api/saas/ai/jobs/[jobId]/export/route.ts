/**
 * @file /api/saas/ai/jobs/[jobId]/export - SaaS API: Job sonuçlarını CSV olarak export
 * @description GET: API key ile tam job sonuçlarını CSV olarak indirir.
 *              Auth: withApiKey (workspace üyeliği zorunlu)
 *              Yanıt: text/csv stream (inline) — public URL varsa redirect tercih edilebilir
 *
 *              Bu endpoint /api/saas/ai/jobs/[jobId] (status) endpoint'inin
 *              tam CSV kardeşi — limit yok, tüm sonuçlar.
 */

import { NextRequest, NextResponse } from 'next/server';
import { withApiKey } from '@/lib/apiKeyMiddleware';
import { ensureSaasScope } from '@/lib/saasScopes';
import { getJobWorkspaceIfOwned } from '@/lib/saasWorkspace';
import { aiBulkService } from '@/modules/ai-bulk/service';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const GET = withApiKey(async (req: NextRequest, ctx) => {
  // Scope kontrolü — read veya bulk:write (admin de geçer)
  const scopeError = ensureSaasScope(ctx.scopes, ['ai:describe:read', 'ai:bulk:write']);
  if (scopeError) return scopeError;

  const jobId = req.nextUrl.pathname.split('/').filter(Boolean).slice(-2, -1)[0]!;

  // 1. Workspace sahiplik kontrolü
  const owned = await getJobWorkspaceIfOwned(jobId, ctx.userId);
  if (!owned) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Job bulunamadı' } },
      { status: 404 }
    );
  }

  // 2. CSV export — R2 veya local fallback
  try {
    const csvUrl = await aiBulkService.exportResultsCsv(jobId);

    logger.info('[saas/ai/jobs/export] CSV exported', {
      keyId: ctx.keyId,
      jobId,
      csvUrl,
    });

    return NextResponse.json({
      success: true,
      data: {
        jobId,
        csvUrl,
        // CSV'yi inline da streamleyebiliriz ama external storage URL'i
        // dönmek band genişliği açısından daha verimli. İsterseniz
        // ?inline=1 query ile burada stream davranışı eklenebilir.
        expiresAt: null,
      },
    });
  } catch (err) {
    logger.error('[saas/ai/jobs/export] exportResultsCsv failed', {
      keyId: ctx.keyId,
      jobId,
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      {
        success: false,
        error: { code: 'EXPORT_FAILED', message: 'CSV export başarısız' },
      },
      { status: 500 }
    );
  }
});
