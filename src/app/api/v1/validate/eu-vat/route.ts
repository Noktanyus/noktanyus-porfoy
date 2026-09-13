import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTrApi } from '@/modules/tr-api/routeHelper';
import { validateEuVatJsvat } from '@/modules/tr-api';

const BodySchema = z.object({
  vat: z.string().min(4).max(24),
});

export const POST = withTrApi(BodySchema, async (data) => {
  return NextResponse.json({ success: true, data: validateEuVatJsvat(data.vat) });
});
