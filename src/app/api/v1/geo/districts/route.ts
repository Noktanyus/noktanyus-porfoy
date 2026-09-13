import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTrApi } from '@/modules/tr-api/routeHelper';
import { fetchTurkiyeDistricts } from '@/modules/tr-api';

const BodySchema = z.object({
  provinceId: z.number().int().min(1).max(81),
});

export const POST = withTrApi(BodySchema, async (data) => {
  return NextResponse.json({ success: true, data: await fetchTurkiyeDistricts(data.provinceId) });
});
