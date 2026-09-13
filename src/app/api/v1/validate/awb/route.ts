import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTrApi } from '@/modules/tr-api/routeHelper';
import { validateAwb } from '@/modules/tr-api';

const BodySchema = z.object({
  awb: z.string().min(8).max(20),
});

export const POST = withTrApi(BodySchema, async (data) => {
  return NextResponse.json({ success: true, data: validateAwb(data.awb) });
});
