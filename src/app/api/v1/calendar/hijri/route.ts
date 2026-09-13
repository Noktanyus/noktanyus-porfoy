import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTrApi } from '@/modules/tr-api/routeHelper';
import { convertHijriGregorian } from '@/modules/tr-api';

const BodySchema = z.object({ from: z.enum(['gregorian','hijri']), year: z.number().int(), month: z.number().int().min(1).max(12), day: z.number().int().min(1).max(31) });

export const POST = withTrApi(BodySchema, async (data) => {
  try {
    return NextResponse.json({ success: true, data: convertHijriGregorian(data) });
  } catch (e) {
    return NextResponse.json({ success: false, error: { code: 'VALIDATION', message: (e as Error).message } }, { status: 400 });
  }
});
