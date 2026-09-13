import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTrApi } from '@/modules/tr-api/routeHelper';
import { isTurkishBusinessDay } from '@/modules/tr-api';

const BodySchema = z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) });

export const POST = withTrApi(BodySchema, async (data) => {
  try {
    return NextResponse.json({ success: true, data: isTurkishBusinessDay(data.date) });
  } catch (e) {
    return NextResponse.json({ success: false, error: { code: 'VALIDATION', message: (e as Error).message } }, { status: 400 });
  }
});
