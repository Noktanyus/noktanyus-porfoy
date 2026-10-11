/**
 * POST /api/v1/commerce/customs-tax — TR Yurt Dışı Alışveriş Bireysel Gümrük Vergisi (30 €) API
 * Ağustos 2024 Cumhurbaşkanı Kararnamesi uyarınca 30 € sınırı, AB (%30) / Çin (%60) gümrük vergisi, ÖTV IV (%20) ve harçlar.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTrApi } from '@/modules/tr-api/routeHelper';
import { calculateCustomsTax } from '@/modules/tr-api/customsTax';

const CustomsTaxSchema = z.object({
  productPrice: z.number().nonnegative(),
  currency: z.enum(['EUR', 'USD', 'TRY']).optional().default('EUR'),
  origin: z.enum(['EU', 'NON_EU']).optional().default('NON_EU'),
  includeShippingInCustomsValue: z.boolean().optional().default(false),
  shippingFee: z.number().nonnegative().optional().default(0),
  isSpecialConsumptionTaxApplied: z.boolean().optional().default(false),
  eurExchangeRate: z.number().positive().optional(),
  usdToEurRate: z.number().positive().optional(),
});

export const POST = withTrApi(CustomsTaxSchema, async (data) => {
  const result = calculateCustomsTax({
    productPrice: data.productPrice,
    currency: data.currency ?? 'EUR',
    origin: data.origin ?? 'NON_EU',
    includeShippingInCustomsValue: data.includeShippingInCustomsValue ?? false,
    shippingFee: data.shippingFee ?? 0,
    isSpecialConsumptionTaxApplied: data.isSpecialConsumptionTaxApplied ?? false,
    eurExchangeRate: data.eurExchangeRate,
    usdToEurRate: data.usdToEurRate,
  });

  return NextResponse.json({
    success: true,
    data: result,
  });
});
