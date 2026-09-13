import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTrApi } from '@/modules/tr-api/routeHelper';
import { getHolidays } from '@/modules/tr-api';

const BodySchema = z.object({
  country: z.string().min(2).max(3),
  year: z.number().int().min(1970).max(2100),
});

export const POST = withTrApi(BodySchema, async (data) => {
  return NextResponse.json({ success: true, data: getHolidays(data) });
});
