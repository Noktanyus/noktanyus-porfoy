/**
 * POST /api/v1/labor/net-to-gross — net → brüt maaş tahmini
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTrApi } from '@/modules/tr-api/routeHelper';
import { calculateNetToGross } from '@/modules/tr-api';

const BodySchema = z.object({
  monthlyNetCents: z.number().int().positive().max(100_000_000_00),
  monthIndex: z.number().int().min(1).max(12).optional(),
  sgkCeilingCents: z.number().int().positive().max(100_000_000_00).optional(),
  includeStampTax: z.boolean().optional(),
});

export const POST = withTrApi(BodySchema, async (data) => {
  const result = calculateNetToGross(data);
  return NextResponse.json({ success: true, data: result });
});
