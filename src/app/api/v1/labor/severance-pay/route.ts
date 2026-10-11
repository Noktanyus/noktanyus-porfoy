/**
 * POST /api/v1/labor/severance-pay — 4857 İş Kanunu Kıdem, İhbar & Yıllık İzin Motoru API
 * 1475 sayılı Kanun m.14 ve 4857 sayılı İş Kanunu m.17 uyarınca giydirilmiş brüt ücret,
 * Hazine resmi kıdem tavanı, damga vergisi, ihbar önelleri ve net tazminat hakediş dökümü.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTrApi } from '@/modules/tr-api/routeHelper';
import { calculateSeverancePay } from '@/modules/tr-api/severancePay';

const SeverancePaySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-AA-GG formatında olmalıdır'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-AA-GG formatında olmalıdır'),
  grossSalary: z.number().positive(),
  regularBenefitsMonthly: z.number().nonnegative().optional().default(0),
  customSeveranceCap: z.number().positive().optional(),
  calculateNoticePay: z.boolean().optional().default(true),
  noticeIncomeTaxRate: z.number().min(15).max(40).optional().default(15),
  unusedLeaveDays: z.number().int().nonnegative().optional().default(0),
});

export const POST = withTrApi(SeverancePaySchema, async (data) => {
  const result = calculateSeverancePay({
    startDate: data.startDate,
    endDate: data.endDate,
    grossSalary: data.grossSalary,
    regularBenefitsMonthly: data.regularBenefitsMonthly ?? 0,
    customSeveranceCap: data.customSeveranceCap,
    calculateNoticePay: data.calculateNoticePay ?? true,
    noticeIncomeTaxRate: data.noticeIncomeTaxRate ?? 15,
    unusedLeaveDays: data.unusedLeaveDays ?? 0,
  });

  return NextResponse.json({
    success: true,
    data: result,
  });
});
