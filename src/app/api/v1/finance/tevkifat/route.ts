import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTrApi } from '@/modules/tr-api/routeHelper';
import { calculateKdvWithholding } from '@/modules/tr-api';

const BodySchema = z.object({
  amountCents: z.number().int().nonnegative().max(100_000_000_00),
  vatRate: z.union([z.literal(0), z.literal(1), z.literal(10), z.literal(20)]).optional(),
  mode: z.enum(['net', 'gross']).optional(),
  withholding: z
    .union([
      z.enum(['2/10', '3/10', '4/10', '5/10', '7/10', '9/10', '10/10']),
      z.number().min(0).max(1),
    ])
    .optional(),
});

export const POST = withTrApi(BodySchema, async (data) => {
  try {
    const result = calculateKdvWithholding(data);
    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION', message: (err as Error).message } },
      { status: 400 }
    );
  }
});
