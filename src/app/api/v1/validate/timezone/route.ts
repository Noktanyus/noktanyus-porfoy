import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTrApi } from '@/modules/tr-api/routeHelper';
import { validateTimezone } from '@/modules/tr-api';

const BodySchema = z.object({
  zone: z.string().min(3).max(64),
});

export const POST = withTrApi(BodySchema, async (data) => {
  return NextResponse.json({ success: true, data: validateTimezone(data.zone) });
});
