import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTrApi } from '@/modules/tr-api/routeHelper';
import { validateBtcBase58Check } from '@/modules/tr-api';

const BodySchema = z.object({ address: z.string().min(14).max(90) });

export const POST = withTrApi(BodySchema, async (data) => {
  return NextResponse.json({ success: true, data: validateBtcBase58Check(data.address) });
});
