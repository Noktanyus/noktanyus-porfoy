import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTrApi } from '@/modules/tr-api/routeHelper';
import { validateGln } from '@/modules/tr-api';

const BodySchema = z.object({
  gln: z.string().min(8).max(32),
});

export const POST = withTrApi(BodySchema, async (data) => {
  return NextResponse.json({ success: true, data: validateGln(data.gln) });
});
