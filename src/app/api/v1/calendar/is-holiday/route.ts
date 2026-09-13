import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTrApi } from '@/modules/tr-api/routeHelper';
import { isHolidayDate } from '@/modules/tr-api';

const BodySchema = z.object({
  country: z.string().min(2).max(3),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const POST = withTrApi(BodySchema, async (data) => {
  return NextResponse.json({ success: true, data: isHolidayDate(data) });
});
