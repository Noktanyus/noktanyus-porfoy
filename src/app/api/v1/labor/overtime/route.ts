/**
 * POST /api/v1/labor/overtime — fazla çalışma ücreti
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTrApi } from '@/modules/tr-api/routeHelper';
import { calculateOvertime } from '@/modules/tr-api';

const BodySchema = z.object({
  monthlyGrossCents: z.number().int().positive().max(100_000_000_00),
  hours: z.number().positive().max(500),
  kind: z.enum(['overtime', 'excess', 'holiday']).optional(),
});

export const POST = withTrApi(BodySchema, async (data) => {
  try {
    const result = calculateOvertime(data);
    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION', message: (err as Error).message } },
      { status: 400 }
    );
  }
});
