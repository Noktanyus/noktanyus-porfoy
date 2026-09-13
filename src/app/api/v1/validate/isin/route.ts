import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTrApi } from '@/modules/tr-api/routeHelper';
import { validateIsin } from '@/modules/tr-api';

const BodySchema = z.object({ isin: z.string().min(12).max(16) });

export const POST = withTrApi(BodySchema, async (data) => {
  return NextResponse.json({ success: true, data: validateIsin(data.isin) });
});
