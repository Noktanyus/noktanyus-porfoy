import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTrApi } from '@/modules/tr-api/routeHelper';
import { validateBic } from '@/modules/tr-api';

const BodySchema = z.object({ bic: z.string().min(8).max(15) });

export const POST = withTrApi(BodySchema, async (data) => {
  return NextResponse.json({ success: true, data: validateBic(data.bic) });
});
