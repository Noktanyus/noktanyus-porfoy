import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTrApi } from '@/modules/tr-api/routeHelper';
import { calculateKdv } from '@/modules/tr-api';

const BodySchema = z.object({
  amountCents: z.number().int().nonnegative().max(100_000_000_00),
  vatRate: z.number().min(0).max(100).optional(),
  mode: z.enum(['net', 'gross']).optional(),
});

export const POST = withTrApi(BodySchema, async (data) => {
  const result = calculateKdv(data);
  return NextResponse.json({ success: true, data: result });
});
