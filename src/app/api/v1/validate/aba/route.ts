import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTrApi } from '@/modules/tr-api/routeHelper';
import { validateAbaRouting } from '@/modules/tr-api';

const BodySchema = z.object({ routingNumber: z.string().min(9).max(12) });

export const POST = withTrApi(BodySchema, async (data) => {
  return NextResponse.json({ success: true, data: validateAbaRouting(data.routingNumber) });
});
