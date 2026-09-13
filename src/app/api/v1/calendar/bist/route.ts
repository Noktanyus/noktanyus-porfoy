import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTrApi } from '@/modules/tr-api/routeHelper';
import { bistTradingDays } from '@/modules/tr-api';

const BodySchema = z.object({ year: z.number().int().min(2000).max(2100) });

export const POST = withTrApi(BodySchema, async (data) => {
  try {
    const r = bistTradingDays(data);
    return NextResponse.json({ success: true, data: { year: r.year, count: r.count, tradingDays: r.tradingDays } });
  } catch (e) {
    return NextResponse.json({ success: false, error: { code: 'VALIDATION', message: (e as Error).message } }, { status: 400 });
  }
});
