import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTrApi } from '@/modules/tr-api/routeHelper';
import { decodeVinNhtsa } from '@/modules/tr-api';

const BodySchema = z.object({
  vin: z.string().min(11).max(20),
});

export const POST = withTrApi(BodySchema, async (data) => {
  return NextResponse.json({ success: true, data: await decodeVinNhtsa(data.vin) });
});
