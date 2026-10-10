/**
 * POST /api/v1/finance/smm — Serbest Meslek Makbuzu (SMM) Hesaplama API
 * Brütten nete veya netten brüte stopaj ve KDV tevkifatı hesaplar.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTrApi } from '@/modules/tr-api/routeHelper';
import { calculateSmm, type SmmWithholdingFraction } from '@/modules/tr-api/smm';

const SmmSchema = z.object({
  amount: z.number().positive(),
  mode: z.enum(['gross', 'net']).default('gross'),
  stopajRate: z.number().min(0).max(100).optional(),
  vatRate: z.number().min(0).max(100).optional(),
  withholding: z
    .enum(['none', '2/10', '3/10', '5/10', '7/10', '9/10', '10/10'])
    .optional(),
});

export const POST = withTrApi(SmmSchema, async (data) => {
  const result = calculateSmm({
    amount: data.amount,
    mode: data.mode ?? 'gross',
    stopajRate: data.stopajRate,
    vatRate: data.vatRate,
    withholding: data.withholding as SmmWithholdingFraction | undefined,
  });

  return NextResponse.json({
    success: true,
    data: result,
  });
});
