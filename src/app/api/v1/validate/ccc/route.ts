import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTrApi } from '@/modules/tr-api/routeHelper';
import { validateCcc } from '@/modules/tr-api';

const BodySchema = z.object({
  ccc: z.string().min(20).max(24),
});

export const POST = withTrApi(BodySchema, async (data) => {
  return NextResponse.json({ success: true, data: validateCcc(data.ccc) });
});
