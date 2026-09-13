import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTrApi } from '@/modules/tr-api/routeHelper';
import { calculateTebligatClock } from '@/modules/tr-api';

const BodySchema = z.object({ notifiedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), days: z.number().int().positive().max(365).optional(), mode: z.enum(['calendar','business']).optional() });

export const POST = withTrApi(BodySchema, async (data) => {
  try {
    return NextResponse.json({ success: true, data: calculateTebligatClock(data) });
  } catch (e) {
    return NextResponse.json({ success: false, error: { code: 'VALIDATION', message: (e as Error).message } }, { status: 400 });
  }
});
