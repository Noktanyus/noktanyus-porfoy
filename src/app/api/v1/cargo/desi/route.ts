/**
 * POST /api/v1/cargo/desi — Türkiye standartlarında Desi ve ücrete esas ağırlık hesaplayıcı
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTrApi } from '@/modules/tr-api/routeHelper';
import { calculateCargoDesi } from '@/modules/tr-api';

const BodySchema = z.object({
  widthCm: z.number().positive().max(1000),
  lengthCm: z.number().positive().max(1000),
  heightCm: z.number().positive().max(1000),
  weightKg: z.number().nonnegative().max(10000).optional(),
  divisor: z.union([z.literal(3000), z.literal(5000)]).optional(),
});

export const POST = withTrApi(BodySchema, async (data) => {
  const result = calculateCargoDesi(data);
  return NextResponse.json({ success: true, data: result });
});
