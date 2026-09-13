import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTrApi } from '@/modules/tr-api/routeHelper';
import { verhoeffValidate } from '@/modules/tr-api';

const BodySchema = z.object({
  value: z.string().min(2).max(64),
});

export const POST = withTrApi(BodySchema, async (data) => {
  return NextResponse.json({ success: true, data: verhoeffValidate(data.value) });
});
