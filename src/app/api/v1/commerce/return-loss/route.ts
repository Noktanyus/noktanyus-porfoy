/**
 * POST /api/v1/commerce/return-loss — TR E-Ticaret İade Zararı & Kârlılık Motoru API
 * E-ticaret ve pazaryeri siparişlerinde iade oranı, birim zarar, efektif kâr ve başa baş analizi.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTrApi } from '@/modules/tr-api/routeHelper';
import { calculateReturnLoss } from '@/modules/tr-api/returnLoss';

const ReturnLossSchema = z.object({
  salePrice: z.number().nonnegative(),
  costPrice: z.number().nonnegative(),
  commissionRate: z.number().min(0).max(100),
  vatRate: z.number().min(0).max(100).optional().default(20),
  returnRate: z.number().min(0).max(100),
  shippingOutboundCost: z.number().nonnegative(),
  shippingReturnCost: z.number().nonnegative(),
  packagingCost: z.number().nonnegative().optional().default(0),
  damagedLossRate: z.number().min(0).max(100).optional().default(0),
  marketplaceReturnFee: z.number().nonnegative().optional().default(0),
  monthlyOrderCount: z.number().int().nonnegative().optional(),
});

export const POST = withTrApi(ReturnLossSchema, async (data) => {
  const result = calculateReturnLoss({
    salePrice: data.salePrice,
    costPrice: data.costPrice,
    commissionRate: data.commissionRate,
    vatRate: data.vatRate,
    returnRate: data.returnRate,
    shippingOutboundCost: data.shippingOutboundCost,
    shippingReturnCost: data.shippingReturnCost,
    packagingCost: data.packagingCost,
    damagedLossRate: data.damagedLossRate,
    marketplaceReturnFee: data.marketplaceReturnFee,
    monthlyOrderCount: data.monthlyOrderCount,
  });

  return NextResponse.json({
    success: true,
    data: result,
  });
});
