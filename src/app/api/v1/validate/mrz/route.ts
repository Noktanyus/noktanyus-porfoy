import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTrApi } from '@/modules/tr-api/routeHelper';
import { validateMrzPassport } from '@/modules/tr-api';

const BodySchema = z.object({
  line1: z.string().min(40).max(50),
  line2: z.string().min(40).max(50),
});

export const POST = withTrApi(BodySchema, async (data) => {
  return NextResponse.json({ success: true, data: validateMrzPassport(data) });
});
