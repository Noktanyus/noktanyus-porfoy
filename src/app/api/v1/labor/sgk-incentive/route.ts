/**
 * POST /api/v1/labor/sgk-incentive — SGK 5510 %5 Puan Teşviki & İşveren Maliyeti API
 * 5510 s.K. m.81/ı Hazine prim indirimi (%20.5 → %15.5), asgari ücret desteği (700 TL/ay) ve işveren toplam maliyet dökümü.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTrApi } from '@/modules/tr-api/routeHelper';
import { calculateSgkIncentive } from '@/modules/tr-api/sgkIncentive';

const SgkIncentiveSchema = z.object({
  grossSalaryPerEmployee: z.number().positive(),
  employeeCount: z.number().int().positive().optional().default(1),
  apply5PointsDiscount: z.boolean().optional().default(true),
  applyMinimumWageSupport: z.boolean().optional().default(true),
  customMonthlySupportPerEmployee: z.number().nonnegative().optional(),
});

export const POST = withTrApi(SgkIncentiveSchema, async (data) => {
  const result = calculateSgkIncentive({
    grossSalaryPerEmployee: data.grossSalaryPerEmployee,
    employeeCount: data.employeeCount ?? 1,
    apply5PointsDiscount: data.apply5PointsDiscount ?? true,
    applyMinimumWageSupport: data.applyMinimumWageSupport ?? true,
    customMonthlySupportPerEmployee: data.customMonthlySupportPerEmployee,
  });

  return NextResponse.json({
    success: true,
    data: result,
  });
});
