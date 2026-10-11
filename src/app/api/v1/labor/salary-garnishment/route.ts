/**
 * POST /api/v1/labor/salary-garnishment — TR Maaş Haczi & İcra Sıra Cetveli API
 * 2004 s. İİK m.83 uyarınca 1/4 maaş haczi, nafaka önceliği ve çoklu dosya simülasyonu.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTrApi } from '@/modules/tr-api/routeHelper';
import { calculateSalaryGarnishment } from '@/modules/tr-api/salaryGarnishment';

const GarnishmentFileSchema = z.object({
  fileId: z.string().min(1).max(100),
  remainingDebt: z.number().nonnegative(),
  debtType: z.enum(['regular', 'alimony_arrears']).optional().default('regular'),
  servedDate: z.string().optional(),
});

const SalaryGarnishmentSchema = z.object({
  monthlyNetSalary: z.number().positive(),
  monthlyAlimonyAmount: z.number().nonnegative().optional().default(0),
  customGarnishmentPercent: z.number().min(1).max(100).optional(),
  additionalBonusNet: z.number().nonnegative().optional().default(0),
  bonusGarnishmentPercent: z.number().min(0).max(100).optional(),
  files: z.array(GarnishmentFileSchema).optional(),
});

export const POST = withTrApi(SalaryGarnishmentSchema, async (data) => {
  const result = calculateSalaryGarnishment({
    monthlyNetSalary: data.monthlyNetSalary,
    monthlyAlimonyAmount: data.monthlyAlimonyAmount,
    customGarnishmentPercent: data.customGarnishmentPercent,
    additionalBonusNet: data.additionalBonusNet,
    bonusGarnishmentPercent: data.bonusGarnishmentPercent,
    files: data.files,
  });

  return NextResponse.json({
    success: true,
    data: result,
  });
});
