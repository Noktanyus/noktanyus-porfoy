import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTrApi } from '@/modules/tr-api/routeHelper';
import { validateLocale } from '@/modules/tr-api';

const BodySchema = z.object({
  locale: z.string().min(2).max(16),
});

export const POST = withTrApi(BodySchema, async (data) => {
  return NextResponse.json({ success: true, data: validateLocale(data.locale) });
});
