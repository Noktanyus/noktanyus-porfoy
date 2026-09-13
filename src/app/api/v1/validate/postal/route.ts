import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTrApi } from '@/modules/tr-api/routeHelper';
import { validatePostalCode } from '@/modules/tr-api';

const BodySchema = z.object({
  postalCode: z.string().min(1).max(16),
});

export const POST = withTrApi(BodySchema, async (data) => {
  const result = validatePostalCode(data.postalCode);
  return NextResponse.json({ success: true, data: result });
});
