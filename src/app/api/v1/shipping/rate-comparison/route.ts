/**
 * POST /api/v1/shipping/rate-comparison — Çoklu Taşıyıcı Kargo Barem & Fiyat Karşılaştırma API
 * Türkiye popüler kargo firmaları (Yurtiçi, Aras, MNG, Sürat, PTT, TEX, HepsiJet, Kolay Gelsin)
 * için desi/ağırlık matrahı, barem kategorisi, akaryakıt payı (AKP), mesafe çarpanı ve KDV dahil fiyat dökümü.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTrApi } from '@/modules/tr-api/routeHelper';
import { compareShippingRates } from '@/modules/tr-api/shippingTierComparison';

const ShippingRateComparisonSchema = z.object({
  dimensions: z
    .object({
      widthCm: z.number().nonnegative(),
      lengthCm: z.number().nonnegative(),
      heightCm: z.number().nonnegative(),
    })
    .optional(),
  customVolumetricDesi: z.number().nonnegative().optional(),
  actualWeightKg: z.number().nonnegative().optional(),
  distance: z.enum(['intracity', 'nearby', 'intercity']).optional().default('nearby'),
  cashOnDelivery: z.boolean().optional().default(false),
});

export const POST = withTrApi(ShippingRateComparisonSchema, async (data) => {
  const result = compareShippingRates({
    dimensions: data.dimensions,
    customVolumetricDesi: data.customVolumetricDesi,
    actualWeightKg: data.actualWeightKg,
    distance: data.distance ?? 'nearby',
    cashOnDelivery: data.cashOnDelivery ?? false,
  });

  return NextResponse.json({
    success: true,
    data: result,
  });
});
