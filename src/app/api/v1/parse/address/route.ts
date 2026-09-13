import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTrApi } from '@/modules/tr-api/routeHelper';
import { parseTurkishAddress } from '@/modules/tr-api';

const BodySchema = z.object({ address: z.string().min(3).max(500) });

export const POST = withTrApi(BodySchema, async (data) => {
  return NextResponse.json({ success: true, data: parseTurkishAddress(data.address) });
});
