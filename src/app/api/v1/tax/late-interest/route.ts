/**
 * POST /api/v1/tax/late-interest — 6183 Vergi & Kamu Gecikme Zammı ve Tecil Faizi API
 * 6183 sayılı AATUHK m.51 uyarınca vadesinde ödenmeyen kamu borçları için aylık/günlük
 * gecikme zammı ve m.48 uyarınca tecil faizi taksit planı hesaplayıcı.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTrApi } from '@/modules/tr-api/routeHelper';
import { calculateTaxLateInterest } from '@/modules/tr-api/taxLateInterest';

const TaxLateInterestSchema = z.object({
  principalAmount: z.number().positive(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-AA-GG formatında olmalıdır'),
  paymentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-AA-GG formatında olmalıdır'),
  customMonthlyRatePercent: z.number().positive().optional(),
  calculateInstallments: z.boolean().optional().default(false),
  installmentCount: z.number().int().min(2).max(36).optional().default(12),
});

export const POST = withTrApi(TaxLateInterestSchema, async (data) => {
  const result = calculateTaxLateInterest({
    principalAmount: data.principalAmount,
    dueDate: data.dueDate,
    paymentDate: data.paymentDate,
    customMonthlyRatePercent: data.customMonthlyRatePercent,
    calculateInstallments: data.calculateInstallments ?? false,
    installmentCount: data.installmentCount ?? 12,
  });

  return NextResponse.json({
    success: true,
    data: result,
  });
});
