import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTrApi } from '@/modules/tr-api/routeHelper';
import { validateCusip } from '@/modules/tr-api';

const BodySchema = z.object({ cusip: z.string().min(9).max(12) });

export const POST = withTrApi(BodySchema, async (data) => {
  return NextResponse.json({ success: true, data: validateCusip(data.cusip) });
});
