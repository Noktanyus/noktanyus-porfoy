import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTrApi } from '@/modules/tr-api/routeHelper';
import { validateImo } from '@/modules/tr-api';

const BodySchema = z.object({
  imo: z.string().min(7).max(16),
});

export const POST = withTrApi(BodySchema, async (data) => {
  return NextResponse.json({ success: true, data: validateImo(data.imo) });
});
