import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTrApi } from '@/modules/tr-api/routeHelper';
import { validateRib } from '@/modules/tr-api';

const BodySchema = z.object({
  bank: z.string().min(4).max(5),
  branch: z.string().min(4).max(5),
  account: z.string().min(10).max(12),
  key: z.string().min(2).max(2),
});

export const POST = withTrApi(BodySchema, async (data) => {
  return NextResponse.json({ success: true, data: validateRib(data) });
});
