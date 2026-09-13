import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTrApi } from '@/modules/tr-api/routeHelper';
import { validateWkn } from '@/modules/tr-api';

const BodySchema = z.object({
  wkn: z.string().min(3).max(32),
});

export const POST = withTrApi(BodySchema, async (data) => {
  return NextResponse.json({ success: true, data: validateWkn(data.wkn) });
});
