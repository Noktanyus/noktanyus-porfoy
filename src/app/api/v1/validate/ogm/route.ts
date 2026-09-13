import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTrApi } from '@/modules/tr-api/routeHelper';
import { validateBelgiumOgm } from '@/modules/tr-api';

const BodySchema = z.object({
  ogm: z.string().min(10).max(20),
});

export const POST = withTrApi(BodySchema, async (data) => {
  return NextResponse.json({ success: true, data: validateBelgiumOgm(data.ogm) });
});
