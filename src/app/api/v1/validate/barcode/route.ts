import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTrApi } from '@/modules/tr-api/routeHelper';
import { validateEan13 } from '@/modules/tr-api';

const BodySchema = z.object({
  barcode: z.string().min(13).max(20),
});

export const POST = withTrApi(BodySchema, async (data) => {
  const result = validateEan13(data.barcode);
  return NextResponse.json({ success: true, data: result });
});
