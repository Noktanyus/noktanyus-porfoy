/**
 * POST /api/v1/text/normalize — Türkçe metin sadeleştirme
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTrApi } from '@/modules/tr-api/routeHelper';
import { normalizeTurkishText } from '@/modules/tr-api/builders';

const BodySchema = z.object({
  text: z.string().min(1).max(5000),
  mode: z.enum(['nfc', 'upper', 'lower', 'slug']).optional(),
});

export const POST = withTrApi(BodySchema, async (data) => {
  return NextResponse.json({ success: true, data: normalizeTurkishText(data) });
});
