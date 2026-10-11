/**
 * POST /api/v1/finance/check-discount — TR Çek & Senet Reeskont Faiz & Ortalama Vade API
 * 213 sayılı VUK m.281 ve m.285 uyarınca iç iskonto / dış iskonto formülü, TCMB reeskont oranları ve THP muhasebe kaydı dökümü.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTrApi } from '@/modules/tr-api/routeHelper';
import { calculateCheckDiscount } from '@/modules/tr-api/checkDiscount';

const CheckItemSchema = z.object({
  id: z.string().optional(),
  description: z.string().optional(),
  nominalAmount: z.number().nonnegative(),
  dueDate: z.string(), // YYYY-MM-DD
  itemType: z.enum(['receivable', 'payable']).optional().default('receivable'),
});

const CheckDiscountSchema = z.object({
  valuationDate: z.string().optional(),
  rateOption: z.enum(['discount', 'advance', 'custom']).optional().default('discount'),
  customAnnualRate: z.number().nonnegative().optional(),
  selectedPresetCode: z.string().optional(),
  method: z.enum(['internal', 'external']).optional().default('internal'),
  items: z.array(CheckItemSchema).min(1),
});

export const POST = withTrApi(CheckDiscountSchema, async (data) => {
  const result = calculateCheckDiscount({
    valuationDate: data.valuationDate,
    rateOption: data.rateOption ?? 'discount',
    customAnnualRate: data.customAnnualRate,
    selectedPresetCode: data.selectedPresetCode,
    method: data.method ?? 'internal',
    items: data.items.map((item) => ({
      id: item.id,
      description: item.description,
      nominalAmount: item.nominalAmount,
      dueDate: item.dueDate,
      itemType: item.itemType ?? 'receivable',
    })),
  });

  return NextResponse.json({
    success: true,
    data: result,
  });
});
