import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTrApi } from '@/modules/tr-api/routeHelper';
import { validateAadhaar } from '@/modules/tr-api';

const BodySchema = z.object({
  aadhaar: z.string().min(12).max(16),
});

export const POST = withTrApi(BodySchema, async (data) => {
  return NextResponse.json({ success: true, data: validateAadhaar(data.aadhaar) });
});
