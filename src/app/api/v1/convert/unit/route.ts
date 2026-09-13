import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTrApi } from '@/modules/tr-api/routeHelper';
import { convertUnit } from '@/modules/tr-api';

const BodySchema = z.object({ category: z.enum(['length','mass','temperature','area','volume']), from: z.string().min(1).max(8), to: z.string().min(1).max(8), value: z.number() });

export const POST = withTrApi(BodySchema, async (data) => {
  try {
    return NextResponse.json({ success: true, data: convertUnit(data) });
  } catch (e) {
    return NextResponse.json({ success: false, error: { code: 'VALIDATION', message: (e as Error).message } }, { status: 400 });
  }
});
