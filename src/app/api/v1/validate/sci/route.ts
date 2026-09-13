import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTrApi } from '@/modules/tr-api/routeHelper';
import { validateSci } from '@/modules/tr-api';

const BodySchema = z.object({
  sci: z.string().min(3).max(32),
});

export const POST = withTrApi(BodySchema, async (data) => {
  return NextResponse.json({ success: true, data: validateSci(data.sci) });
});
