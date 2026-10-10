/**
 * POST /api/v1/finance/rent-increase — TR Yasal Kira Artış Oranı & TÜFE Tavanı API
 * 6098 s. TBK m.344 uyarınca 12 aylık TÜFE ortalaması ve işyeri stopaj dökümü.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTrApi } from '@/modules/tr-api/routeHelper';
import { calculateRentIncrease } from '@/modules/tr-api/rentIncrease';

const RentIncreaseSchema = z.object({
  currentRent: z.number().positive(),
  propertyType: z.enum(['residential', 'commercial']).optional().default('residential'),
  year: z.number().int().min(2020).max(2030).optional(),
  month: z.number().int().min(1).max(12).optional(),
  customTufeRate: z.number().min(0).max(500).optional(),
  commercialTaxMode: z.enum(['none', 'stopaj', 'vat']).optional().default('none'),
});

export const POST = withTrApi(RentIncreaseSchema, async (data) => {
  const result = calculateRentIncrease({
    currentRent: data.currentRent,
    propertyType: data.propertyType,
    year: data.year,
    month: data.month,
    customTufeRate: data.customTufeRate,
    commercialTaxMode: data.commercialTaxMode,
  });

  return NextResponse.json({
    success: true,
    data: result,
  });
});
