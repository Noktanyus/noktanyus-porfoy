import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTrApi } from '@/modules/tr-api/routeHelper';
import { lookupPostalProvince } from '@/modules/tr-api';

const BodySchema = z.object({
  postalCode: z.string().min(5).max(10),
});

export const POST = withTrApi(BodySchema, async (data) => {
  return NextResponse.json({ success: true, data: lookupPostalProvince(data.postalCode) });
});
