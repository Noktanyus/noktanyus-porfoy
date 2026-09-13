import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTrApi } from '@/modules/tr-api/routeHelper';
import { validateClabe } from '@/modules/tr-api';

const BodySchema = z.object({
  clabe: z.string().min(18).max(22),
});

export const POST = withTrApi(BodySchema, async (data) => {
  return NextResponse.json({ success: true, data: validateClabe(data.clabe) });
});
