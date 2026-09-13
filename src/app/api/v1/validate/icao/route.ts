import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTrApi } from '@/modules/tr-api/routeHelper';
import { validateIcao } from '@/modules/tr-api';

const BodySchema = z.object({
  code: z.string().length(4),
});

export const POST = withTrApi(BodySchema, async (data) => {
  return NextResponse.json({ success: true, data: validateIcao(data.code) });
});
