import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTrApi } from '@/modules/tr-api/routeHelper';
import { fetchTcmbRates } from '@/modules/tr-api';

const BodySchema = z.object({}).passthrough();

export const POST = withTrApi(BodySchema, async () => {
  return NextResponse.json({ success: true, data: await fetchTcmbRates() });
});
