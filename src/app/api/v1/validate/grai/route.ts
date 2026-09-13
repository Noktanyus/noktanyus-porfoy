import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTrApi } from '@/modules/tr-api/routeHelper';
import { validateGrai } from '@/modules/tr-api';

const BodySchema = z.object({
  grai: z.string().min(8).max(32),
});

export const POST = withTrApi(BodySchema, async (data) => {
  return NextResponse.json({ success: true, data: validateGrai(data.grai) });
});
