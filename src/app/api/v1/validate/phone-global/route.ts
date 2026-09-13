import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTrApi } from '@/modules/tr-api/routeHelper';
import { validatePhoneGlobal } from '@/modules/tr-api';

const BodySchema = z.object({
  phone: z.string().min(5).max(32),
  defaultCountry: z.string().min(2).max(3).optional(),
});

export const POST = withTrApi(BodySchema, async (data) => {
  return NextResponse.json({ success: true, data: validatePhoneGlobal(data) });
});
