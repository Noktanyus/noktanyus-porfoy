import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTrApi } from '@/modules/tr-api/routeHelper';
import { validateColorHex } from '@/modules/tr-api';

const BodySchema = z.object({
  color: z.string().min(4).max(16),
});

export const POST = withTrApi(BodySchema, async (data) => {
  return NextResponse.json({ success: true, data: validateColorHex(data.color) });
});
