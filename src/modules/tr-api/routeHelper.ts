/**
 * Shared helpers for /api/v1 TR routes.
 * Abonelik kotası veya ön ödemeli kredi (başarısız 5xx'te iade).
 */

import { NextRequest, NextResponse } from 'next/server';
import type { ZodSchema } from 'zod';
import { withApiKey, hasScope, type ApiKeyContext } from '@/lib/apiKeyMiddleware';
import { checkApiQuota } from '@/lib/planGate';
import { tryDebitApiCredit, refundApiCredit } from '@/lib/apiCredits';

export function getRequiredScopeForPath(pathname: string): string {
  const clean = pathname.replace(/^\/api\/v1\//, '').replace(/\/$/, '');
  const segments = clean.split('/').filter(Boolean);
  return `api:${segments.join(':')}`;
}

export function withTrApi<T>(
  schema: ZodSchema<T>,
  handler: (data: T, ctx: ApiKeyContext, req: NextRequest) => Promise<NextResponse>
) {
  return withApiKey(async (req: NextRequest, ctx: ApiKeyContext) => {
    const requiredScope = getRequiredScopeForPath(req.nextUrl.pathname);
    if (!hasScope(ctx.scopes, requiredScope)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: `Bu endpoint için yetkiniz bulunmamaktadır. Gereken izin: ${requiredScope}`,
          },
        },
        { status: 403 }
      );
    }

    const quota = await checkApiQuota(ctx.userId);
    if (!quota.allowed) {
      return NextResponse.json(
        { success: false, error: { code: 'QUOTA_EXCEEDED', message: quota.reason } },
        { status: 402 }
      );
    }

    const json = await req.json().catch(() => null);
    const parsed = schema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION', message: parsed.error.flatten() } },
        { status: 400 }
      );
    }

    const endpoint = req.nextUrl.pathname;
    let debitLedgerId: string | null = null;

    if (quota.billingSource === 'credits') {
      const debit = await tryDebitApiCredit({ userId: ctx.userId, endpoint });
      if (!debit) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'QUOTA_EXCEEDED',
              message: 'Kredi bakiyesi yetersiz. /magaza/krediler üzerinden yükleme yapın.',
            },
          },
          { status: 402 }
        );
      }
      debitLedgerId = debit.ledgerId;
    }

    try {
      const res = await handler(parsed.data, ctx, req);
      if (debitLedgerId && res.status >= 500) {
        await refundApiCredit({
          userId: ctx.userId,
          endpoint,
          relatedLedgerId: debitLedgerId,
        });
      }
      return res;
    } catch (err) {
      if (debitLedgerId) {
        await refundApiCredit({
          userId: ctx.userId,
          endpoint,
          relatedLedgerId: debitLedgerId,
        });
      }
      throw err;
    }
  });
}
