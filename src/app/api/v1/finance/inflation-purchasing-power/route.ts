/**
 * POST /api/v1/finance/inflation-purchasing-power — TÜİK TÜFE Tarihi Enflasyon & Alım Gücü API
 * TÜİK 2003=100 Tüketici Fiyat Endeksi serisi ile geçmiş bir tutarın günümüz alım gücü eşdeğeri,
 * kümülatif enflasyon, yıllık bileşik artış (CAGR) ve reel alım gücü kaybı dökümü.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTrApi } from '@/modules/tr-api/routeHelper';
import { calculateInflationPurchasingPower } from '@/modules/tr-api/inflationPurchasingPower';

const InflationPurchasingPowerSchema = z.object({
  initialAmount: z.number().nonnegative(),
  startYear: z.number().int().min(2003).max(2050),
  startMonth: z.number().int().min(1).max(12).optional(),
  targetYear: z.number().int().min(2003).max(2050),
  targetMonth: z.number().int().min(1).max(12).optional(),
  customStartIndex: z.number().positive().optional(),
  customTargetIndex: z.number().positive().optional(),
});

export const POST = withTrApi(InflationPurchasingPowerSchema, async (data) => {
  const result = calculateInflationPurchasingPower({
    initialAmount: data.initialAmount,
    startYear: data.startYear,
    startMonth: data.startMonth,
    targetYear: data.targetYear,
    targetMonth: data.targetMonth,
    customStartIndex: data.customStartIndex,
    customTargetIndex: data.customTargetIndex,
  });

  return NextResponse.json({
    success: true,
    data: result,
  });
});
