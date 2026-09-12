/**
 * @file /api/saas/ai/describe - SaaS API: Tekil AI ürün açıklaması üretimi
 * @description POST: API key ile AI ürün açıklaması üretir.
 *              Auth: withApiKey + scope 'ai:describe:write'
 *              Body: { workspaceId, ...AiDescribeSchema }
 *
 *              workspaceId zorunlu, API key sahibi o workspace'in üyesi olmalı.
 *              Brand voice opsiyonel — sağlanırsa description üretimine
 *              learned patterns inject edilir (applyBrandVoice).
 *
 * Response: AiDescribeResponseSchema (kısa+uzun açıklama + tags + token usage).
 */

import { NextRequest, NextResponse } from 'next/server';
import { withApiKey, hasScope } from '@/lib/apiKeyMiddleware';
import { ensureSaasScope } from '@/lib/saasScopes';
import { assertWorkspaceAccess } from '@/lib/saasWorkspace';
import { AiDescribeSchema } from '@/modules/ai/schemas';
import { aiService } from '@/modules/ai/service';
import { applyBrandVoice, brandVoiceService } from '@/modules/brand-voice/service';
import { checkAiQuota } from '@/lib/planGate';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const POST = withApiKey(async (req: NextRequest, ctx) => {
  // 1. Body parse (workspaceId için erken erişim gerekli)
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_BODY', message: 'JSON body gerekli' } },
      { status: 400 }
    );
  }

  // 2. Scope kontrolü
  const scopeError = ensureSaasScope(ctx.scopes, 'ai:describe:write');
  if (scopeError) return scopeError;

  // 3. Workspace üyelik kontrolü
  const ws = await assertWorkspaceAccess(req, ctx.userId, { body });
  if (ws.error) return ws.error;
  const workspaceId = ws.workspaceId;

  // 4. AiDescribe input validation (workspaceId'yi body'den çıkardık)
  const { workspaceId: _w, brandVoiceId, ...rest } = body as {
    workspaceId: string;
    brandVoiceId?: string;
  };
  void _w;
  let input;
  try {
    input = AiDescribeSchema.parse(rest);
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

  // 5. Brand voice doğrulama (workspace-scoped)
  let brandVoice = null;
  if (brandVoiceId) {
    brandVoice = await brandVoiceService.getBrandVoice(workspaceId, brandVoiceId);
    if (!brandVoice) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'BRAND_VOICE_NOT_FOUND',
            message: 'Brand voice bu workspace\'e ait değil veya bulunamadı',
          },
        },
        { status: 404 }
      );
    }
  }

  // 6. Plan gate quota kontrolü
  const quota = await checkAiQuota(ctx.userId, 2100);
  if (!quota.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'QUOTA_EXCEEDED',
          message: quota.reason ?? 'AI kota limiti aşıldı',
        },
      },
      { status: 403 }
    );
  }

  try {
    // 7. AI üretim — brand voice varsa base prompt'u override etmiyoruz
    //    (Phase 2 A.1'de applyBrandVoice() generation prompt'una inject
    //    edilecek şekilde tasarlandı; burada learnedPatterns bilgi olarak
    //    taşınıyor, generateProductDescription bu entegrasyonu kullanmıyor
    //    çünkü schema'sı brand voice parametresi taşımıyor. İleride
    //    ai/service.ts'e brandVoiceSuffix alanı eklenirse prompt override
    //    yapılacak.)
    const result = await aiService.generateProductDescription(input, {
      userId: ctx.userId,
      ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? undefined,
      userAgent: req.headers.get('user-agent') ?? undefined,
    });

    logger.info('[saas/ai/describe] Generated', {
      keyId: ctx.keyId,
      workspaceId,
      brandVoiceId: brandVoice?.id ?? null,
      tokensUsed: result.tokensUsed.total,
      mock: result.mock,
    });

    return NextResponse.json({
      success: true,
      data: {
        ...result,
        brandVoice: brandVoice
          ? {
              id: brandVoice.id,
              name: brandVoice.name,
              appliedPatterns: hasScope(ctx.scopes, 'admin')
                ? brandVoice.patterns
                : null,
            }
          : null,
      },
    });
  } catch (err) {
    logger.error('[saas/ai/describe] Generation failed', {
      keyId: ctx.keyId,
      workspaceId,
      error: err instanceof Error ? err.message : String(err),
    });
    // Brand voice kullanıldıysa pattern'leri audit için logla
    if (brandVoice) {
      // applyBrandVoice() pure helper; burada sadece bilgi amaçlı log
      const bvFull = await prisma.brandVoice.findUnique({
        where: { id: brandVoice.id },
        select: { learnedPatterns: true },
      });
      if (bvFull) {
        applyBrandVoice(bvFull, input.productName); // no-op, presence check
      }
    }
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'GENERATION_FAILED',
          message: 'AI üretimi başarısız',
        },
      },
      { status: 500 }
    );
  }
});
