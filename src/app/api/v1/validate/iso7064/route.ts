import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTrApi } from '@/modules/tr-api/routeHelper';
import { iso7064Mod97, iso7064Mod1110 } from '@/modules/tr-api';

const BodySchema = z.object({
  value: z.string().min(2).max(64),
  mode: z.enum(['mod97', 'mod11_10']).default('mod97'),
});

export const POST = withTrApi(BodySchema, async (data) => {
  return NextResponse.json({ success: true, data: data.mode === 'mod11_10' ? iso7064Mod1110(data.value) : iso7064Mod97(data.value) });
});
