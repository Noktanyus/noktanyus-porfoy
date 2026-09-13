import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTrApi } from '@/modules/tr-api/routeHelper';
import { validateMic } from '@/modules/tr-api';

const BodySchema = z.object({
  mic: z.string().min(3).max(32),
});

export const POST = withTrApi(BodySchema, async (data) => {
  return NextResponse.json({ success: true, data: validateMic(data.mic) });
});
