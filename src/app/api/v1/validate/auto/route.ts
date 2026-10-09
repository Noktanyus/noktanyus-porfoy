/**
 * POST /api/v1/validate/auto — tip tahmini + TR doğrulama
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTrApi } from '@/modules/tr-api/routeHelper';
import { autoValidateTr } from '@/modules/tr-api/builders';

const BodySchema = z.object({
  value: z.string().min(1).max(128),
});

export const POST = withTrApi(BodySchema, async (data) => {
  return NextResponse.json({ success: true, data: autoValidateTr(data.value) });
});
