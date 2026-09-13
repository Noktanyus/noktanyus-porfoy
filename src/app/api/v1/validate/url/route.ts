import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTrApi } from '@/modules/tr-api/routeHelper';
import { validateUrl } from '@/modules/tr-api';

const BodySchema = z.object({ url: z.string().min(4).max(2048) });

export const POST = withTrApi(BodySchema, async (data) => {
  return NextResponse.json({ success: true, data: validateUrl(data.url) });
});
