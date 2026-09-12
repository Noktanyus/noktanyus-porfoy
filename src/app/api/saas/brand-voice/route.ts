/**
 * @file /api/saas/brand-voice - SaaS API: Marka sesi listeleme / silme
 * @description GET: Workspace'in tüm brand voice'larını listeler.
 *              DELETE: Query `?id=<brandVoiceId>` ile belirtilen brand voice'u siler.
 *              Auth: withApiKey (workspace üyeliği zorunlu)
 *              Yanıt: GET → BrandVoiceResponse[], DELETE → { id, deleted: true }
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withApiKey } from '@/lib/apiKeyMiddleware';
import { ensureSaasScope } from '@/lib/saasScopes';
import { assertWorkspaceAccess, extractWorkspaceId } from '@/lib/saasWorkspace';
import { brandVoiceService } from '@/modules/brand-voice/service';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const DeleteQuerySchema = z.object({
  id: z.string().min(1, 'Brand voice id gerekli'),
});

export const GET = withApiKey(async (req: NextRequest, ctx) => {
  // Scope kontrolü — read veya brand-voice:write (admin de geçer)
  const scopeError = ensureSaasScope(ctx.scopes, ['ai:describe:read', 'ai:brand-voice:write']);
  if (scopeError) return scopeError;

  // Workspace (query veya header)
  const workspaceId = extractWorkspaceId(req);
  if (!workspaceId) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'WORKSPACE_REQUIRED',
          message: 'workspaceId gerekli (?workspaceId= veya X-Workspace-Id header)',
        },
      },
      { status: 400 }
    );
  }

  // Üyelik kontrolü
  const ws = await assertWorkspaceAccess(req, ctx.userId);
  if (ws.error) return ws.error;

  const items = await brandVoiceService.listBrandVoices(workspaceId);

  logger.info('[saas/brand-voice/list] Listed', {
    keyId: ctx.keyId,
    workspaceId,
    count: items.length,
  });

  return NextResponse.json({
    success: true,
    data: items,
    meta: { total: items.length },
  });
});

export const DELETE = withApiKey(async (req: NextRequest, ctx) => {
  // Scope kontrolü — yazma yetkisi
  const scopeError = ensureSaasScope(ctx.scopes, 'ai:brand-voice:write');
  if (scopeError) return scopeError;

  // Query doğrula
  const url = new URL(req.url);
  const params = DeleteQuerySchema.safeParse({
    id: url.searchParams.get('id'),
  });
  if (!params.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Geçersiz query parametreleri',
          details: params.error.flatten(),
        },
      },
      { status: 400 }
    );
  }

  // Workspace (id üzerinden implicit kontrol: brand voice workspace'e ait mi?)
  // brandVoiceService.deleteBrandVoice workspace-scoped kontrol yapıyor;
  // yine de kullanıcının workspace üyesi olduğunu doğrulayalım.
  const workspaceId = extractWorkspaceId(req);
  if (!workspaceId) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'WORKSPACE_REQUIRED',
          message: 'workspaceId gerekli',
        },
      },
      { status: 400 }
    );
  }
  const ws = await assertWorkspaceAccess(req, ctx.userId);
  if (ws.error) return ws.error;

  const deleted = await brandVoiceService.deleteBrandVoice(workspaceId, params.data.id, {
    userId: ctx.userId,
    ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? undefined,
    userAgent: req.headers.get('user-agent') ?? undefined,
  });

  if (!deleted) {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Brand voice bulunamadı' },
      },
      { status: 404 }
    );
  }

  logger.info('[saas/brand-voice/delete] Deleted', {
    keyId: ctx.keyId,
    workspaceId,
    brandVoiceId: params.data.id,
  });

  return NextResponse.json({
    success: true,
    data: { id: params.data.id, deleted: true },
  });
});
