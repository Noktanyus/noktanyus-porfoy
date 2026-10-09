/**
 * POST /api/v1/labor/annual-leave — yıllık ücretli izin hakkı
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTrApi } from '@/modules/tr-api/routeHelper';
import { calculateAnnualLeave } from '@/modules/tr-api';

const BodySchema = z.object({
  startDate: z.string().min(8).max(32),
  asOfDate: z.string().min(8).max(32).optional(),
  ageYears: z.number().int().min(14).max(100).optional(),
});

export const POST = withTrApi(BodySchema, async (data) => {
  try {
    const result = calculateAnnualLeave(data);
    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION', message: (err as Error).message } },
      { status: 400 }
    );
  }
});
