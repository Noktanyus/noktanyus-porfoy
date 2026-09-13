import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTrApi } from '@/modules/tr-api/routeHelper';
import { validateSedol } from '@/modules/tr-api';

const BodySchema = z.object({ sedol: z.string().min(7).max(10) });

export const POST = withTrApi(BodySchema, async (data) => {
  return NextResponse.json({ success: true, data: validateSedol(data.sedol) });
});
