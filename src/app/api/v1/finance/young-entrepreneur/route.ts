/**
 * POST /api/v1/finance/young-entrepreneur — TR Genç Girişimci İstisnası & Bağkur Desteği API
 * 193 s. GVK mük. 20/A ve SGK 5510 m.81/k vergi & prim avantajı hesaplayıcı.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTrApi } from '@/modules/tr-api/routeHelper';
import { calculateYoungEntrepreneurBenefit } from '@/modules/tr-api/youngEntrepreneur';

const YoungEntrepreneurSchema = z.object({
  annualRevenue: z.number().nonnegative(),
  annualExpenses: z.number().nonnegative(),
  year: z.union([z.literal(2024), z.literal(2025)]).optional().default(2024),
  customExemptionLimit: z.number().nonnegative().optional(),
  customMonthlyBagkur: z.number().nonnegative().optional(),
  includeBagkurSupport: z.boolean().optional().default(true),
});

export const POST = withTrApi(YoungEntrepreneurSchema, async (data) => {
  const result = calculateYoungEntrepreneurBenefit({
    annualRevenue: data.annualRevenue,
    annualExpenses: data.annualExpenses,
    year: data.year,
    customExemptionLimit: data.customExemptionLimit,
    customMonthlyBagkur: data.customMonthlyBagkur,
    includeBagkurSupport: data.includeBagkurSupport,
  });

  return NextResponse.json({
    success: true,
    data: result,
  });
});
