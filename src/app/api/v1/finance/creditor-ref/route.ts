import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTrApi } from '@/modules/tr-api/routeHelper';
import { processCreditorReference } from '@/modules/tr-api';

const BodySchema = z.object({ reference: z.string().optional(), payload: z.string().optional() }).refine(d => !!(d.reference || d.payload), { message: 'reference veya payload gerekli' });

export const POST = withTrApi(BodySchema, async (data) => {
  return NextResponse.json({ success: true, data: processCreditorReference(data) });
});
