/**
 * @file /api/saas/brand-voice/train - SaaS API: Marka sesi eğitimi
 * @description POST: API key ile workspace için marka sesi eğitir.
 *              Auth: withApiKey + scope 'ai:brand-voice:write'
 *              Body: { workspaceId, ...TrainBrandVoiceSchema }
 *                    workspaceId zorunlu, user workspace üyesi olmalı.
 *
 *              Yanıt: BrandVoiceResponse (id, name, patterns, ...)
 */

import { NextRequest, NextResponse } from 'next/server';
import { withApiKey } from '@/lib/apiKeyMiddleware';
import { ensureSaasScope } from '@/lib/saasScopes';
import { assertWorkspaceAccess } from '@/lib/saasWorkspace';
import { brandVoiceService } from '@/modules/brand-voice/service';
import { TrainBrandVoiceSchema } from '@/modules/brand-voice/schemas';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const POST = withApiKey(async (req: NextRequest, ctx) => {
  // 1. Scope kontrolü
  const scopeError = ensureSaasScope(ctx.scopes, 'ai:brand-voice:write');
  if (scopeError) return scopeError;

  // 2. Body parse
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_BODY', message: 'JSON body gerekli' } },
      { status: 400 }
    );
  }

  // 3. Workspace üyelik kontrolü
  const ws = await assertWorkspaceAccess(req, ctx.userId, { body });
  if (ws.error) return ws.error;
  const workspaceId = ws.workspaceId;

  // 4. TrainBrandVoiceSchema validation
  const { workspaceId: _w, ...rest } = body as { workspaceId: string };
  void _w;
  let input;
  try {
    input = TrainBrandVoiceSchema.parse(rest);
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validasyon hatası',
          details: err instanceof Error ? (err as { errors?: unknown }).errors ?? String(err) : err,
        },
      },
      { status: 400 }
    );
  }

  // 5. Brand voice eğit
  try {
    const result = await brandVoiceService.trainBrandVoice(workspaceId, input, {
      userId: ctx.userId,
      ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? undefined,
      userAgent: req.headers.get('user-agent') ?? undefined,
    });

    logger.info('[saas/brand-voice/train] Trained', {
      keyId: ctx.keyId,
      workspaceId,
      brandVoiceId: result.id,
      sampleCount: result.sampleCount,
    });

    return NextResponse.json(
      {
        success: true,
        data: result,
      },
      { status: 201 }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error('[saas/brand-voice/train] trainBrandVoice failed', {
      keyId: ctx.keyId,
      workspaceId,
      error: msg,
    });

    // Aynı isimde brand voice varsa 409
    if (msg.includes('zaten mevcut')) {
      return NextResponse.json(
        { success: false, error: { code: 'CONFLICT', message: msg } },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { success: false, error: { code: 'TRAIN_FAILED', message: msg } },
      { status: 500 }
    );
  }
});
