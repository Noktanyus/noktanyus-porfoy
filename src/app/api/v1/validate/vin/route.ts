import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTrApi } from '@/modules/tr-api/routeHelper';
import { validateVin } from '@/modules/tr-api';

const BodySchema = z.object({ vin: z.string().min(11).max(24) });

export const POST = withTrApi(BodySchema, async (data) => {
  return NextResponse.json({ success: true, data: validateVin(data.vin) });
});
