import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTrApi } from '@/modules/tr-api/routeHelper';
import { validateAsn } from '@/modules/tr-api';

const BodySchema = z.object({
  asn: z.string().min(1).max(16),
});

export const POST = withTrApi(BodySchema, async (data) => {
  return NextResponse.json({ success: true, data: validateAsn(data.asn) });
});
