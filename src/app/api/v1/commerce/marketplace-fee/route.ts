/**
 * POST /api/v1/commerce/marketplace-fee — TR Pazaryeri Komisyon & Net Kâr Hesaplama API
 * Trendyol, Hepsiburada, Amazon TR ve N11 için komisyon, kargo, kesintiler ve kâr dökümü.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTrApi } from '@/modules/tr-api/routeHelper';
import { calculateMarketplaceFee } from '@/modules/tr-api/marketplaceFee';

const MarketplaceFeeSchema = z.object({
  platform: z.enum(['trendyol', 'hepsiburada', 'amazon_tr', 'n11']).default('trendyol'),
  salePrice: z.number().positive(),
  purchasePrice: z.number().min(0).default(0),
  categoryId: z.string().optional(),
  customCommissionRate: z.number().min(0).max(100).optional(),
  cargoDesi: z.number().min(0).max(1000).optional(),
  cargoCost: z.number().min(0).optional(),
  serviceFee: z.number().min(0).optional(),
  packagingCost: z.number().min(0).optional(),
  applyWithholding: z.boolean().optional().default(false),
});

export const POST = withTrApi(MarketplaceFeeSchema, async (data) => {
  const result = calculateMarketplaceFee({
    platform: data.platform ?? 'trendyol',
    salePrice: data.salePrice,
    purchasePrice: data.purchasePrice ?? 0,
    categoryId: data.categoryId,
    customCommissionRate: data.customCommissionRate,
    cargoDesi: data.cargoDesi,
    cargoCost: data.cargoCost,
    serviceFee: data.serviceFee,
    packagingCost: data.packagingCost,
    applyWithholding: data.applyWithholding,
  });

  return NextResponse.json({
    success: true,
    data: result,
  });
});
