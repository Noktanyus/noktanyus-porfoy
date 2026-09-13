import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTrApi } from '@/modules/tr-api/routeHelper';
import { validateDoi } from '@/modules/tr-api';

const BodySchema = z.object({
  doi: z.string().min(5).max(256),
});

export const POST = withTrApi(BodySchema, async (data) => {
  return NextResponse.json({ success: true, data: validateDoi(data.doi) });
});
