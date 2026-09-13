import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTrApi } from '@/modules/tr-api/routeHelper';
import { calculateSeverance } from '@/modules/tr-api';

const BodySchema = z.object({
  monthlyGrossCents: z.number().int().positive().max(100_000_000_00),
  startDate: z.string().min(8).max(32),
  endDate: z.string().min(8).max(32),
  severanceCeilingCents: z.number().int().positive().max(100_000_000_00).optional(),
});

export const POST = withTrApi(BodySchema, async (data) => {
  try {
    const result = calculateSeverance(data);
    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION', message: (err as Error).message } },
      { status: 400 }
    );
  }
});
