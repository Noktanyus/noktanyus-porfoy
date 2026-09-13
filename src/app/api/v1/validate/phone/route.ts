import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTrApi } from '@/modules/tr-api/routeHelper';
import { validatePhone } from '@/modules/tr-api';

const BodySchema = z.object({
  phone: z.string().min(1).max(32),
  type: z.enum(['any', 'mobile', 'landline']).optional(),
});

export const POST = withTrApi(BodySchema, async (data) => {
  const result = validatePhone(data.phone, data.type ?? 'any');
  return NextResponse.json({ success: true, data: result });
});
