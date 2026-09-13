import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTrApi } from '@/modules/tr-api/routeHelper';
import { validateIsoLanguage } from '@/modules/tr-api';

const BodySchema = z.object({
  code: z.string().min(2).max(8),
});

export const POST = withTrApi(BodySchema, async (data) => {
  return NextResponse.json({ success: true, data: validateIsoLanguage(data.code) });
});
