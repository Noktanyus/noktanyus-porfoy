/**
 * POST /api/v1/validate/batch — toplu doğrulama (1 kredi / öğe)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withApiKey, type ApiKeyContext } from '@/lib/apiKeyMiddleware';
import { checkApiQuota } from '@/lib/planGate';
import { tryDebitApiCredit, refundApiCredit } from '@/lib/apiCredits';
import { runBatchValidate } from '@/modules/tr-api';

const BodySchema = z.object({
  type: z.enum([
    'tckn', 'vkn', 'iban', 'phone', 'postal', 'plate', 'card', 'imei', 'ean13',
    'vin', 'container', 'isbn10', 'isbn13', 'issn', 'isin', 'cusip', 'sedol',
    'aba', 'bic', 'gtin', 'uuid', 'url', 'ip', 'eth', 'btc', 'mersis', 'kep', 'cardBrand',
  ]),
  values: z.array(z.string().min(1).max(2048)).min(1).max(100),
});

export const POST = withApiKey(async (req: NextRequest, ctx: ApiKeyContext) => {
  const quota = await checkApiQuota(ctx.userId);
  if (!quota.allowed) {
    return NextResponse.json(
      { success: false, error: { code: 'QUOTA_EXCEEDED', message: quota.reason } },
      { status: 402 }
    );
  }

  const json = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION', message: parsed.error.flatten() } },
      { status: 400 }
    );
  }

  const n = parsed.data.values.length;
  let debitLedgerId: string | null = null;

  if (quota.billingSource === 'credits') {
    const debit = await tryDebitApiCredit({
      userId: ctx.userId,
      amount: n,
      endpoint: '/api/v1/validate/batch',
    });
    if (!debit) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'QUOTA_EXCEEDED',
            message: `${n} kredi gerekli; bakiye yetersiz.`,
          },
        },
        { status: 402 }
      );
    }
    debitLedgerId = debit.ledgerId;
  } else if (quota.billingSource === 'subscription') {
    // Abonelik: aylık kotada N istek sayılır (usage middleware ayrıca 1 yazar;
    // batch için ek kullanım kaydı opsiyonel — kota kontrolü remaining >= n)
    if (
      Number.isFinite(quota.remainingRequests) &&
      quota.remainingRequests < n
    ) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'QUOTA_EXCEEDED',
            message: `Aylık kotada ${n} istek için yer yok (kalan: ${quota.remainingRequests}).`,
          },
        },
        { status: 402 }
      );
    }
  }

  try {
    const data = runBatchValidate(parsed.data);
    return NextResponse.json({ success: true, data });
  } catch (err) {
    if (debitLedgerId) {
      await refundApiCredit({
        userId: ctx.userId,
        amount: n,
        endpoint: '/api/v1/validate/batch',
        relatedLedgerId: debitLedgerId,
      });
    }
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION', message: (err as Error).message } },
      { status: 400 }
    );
  }
});
