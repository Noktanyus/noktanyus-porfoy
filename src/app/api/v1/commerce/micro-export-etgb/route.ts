/**
 * POST /api/v1/commerce/micro-export-etgb — TR E-İhracat / Mikro İhracat (ETGB) & KDV İadesi API
 * 300 kg / 15.000 € mikro ihracat uygunluk kontrolü, KDV istisnası (301), KDV iadesi ve GVK 89/16 analizi.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTrApi } from '@/modules/tr-api/routeHelper';
import { evaluateMicroExport } from '@/modules/tr-api/microExportEtgb';

const MicroExportSchema = z.object({
  weightKg: z.number().nonnegative(),
  invoiceAmount: z.number().nonnegative(),
  currency: z.enum(['EUR', 'USD', 'TRY', 'GBP']).optional().default('EUR'),
  eurExchangeRate: z.number().positive().optional(),
  usdToEurRate: z.number().positive().optional(),
  gbpToEurRate: z.number().positive().optional(),
  costOfGoodsSold: z.number().nonnegative().optional().default(0),
  costVatRate: z.union([z.literal(0), z.literal(1), z.literal(10), z.literal(20)]).optional().default(20),
  estimatedProfitMarginPercent: z.number().min(0).max(100).optional().default(25),
  qualifiesForGvk89Exemption: z.boolean().optional().default(false),
});

export const POST = withTrApi(MicroExportSchema, async (data) => {
  const result = evaluateMicroExport({
    weightKg: data.weightKg,
    invoiceAmount: data.invoiceAmount,
    currency: data.currency ?? 'EUR',
    eurExchangeRate: data.eurExchangeRate,
    usdToEurRate: data.usdToEurRate,
    gbpToEurRate: data.gbpToEurRate,
    costOfGoodsSold: data.costOfGoodsSold ?? 0,
    costVatRate: data.costVatRate ?? 20,
    estimatedProfitMarginPercent: data.estimatedProfitMarginPercent ?? 25,
    qualifiesForGvk89Exemption: data.qualifiesForGvk89Exemption ?? false,
  });

  return NextResponse.json({
    success: true,
    data: result,
  });
});
