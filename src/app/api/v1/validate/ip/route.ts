import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTrApi } from '@/modules/tr-api/routeHelper';
import { validateIp } from '@/modules/tr-api';

const BodySchema = z.object({ ip: z.string().min(3).max(64) });

export const POST = withTrApi(BodySchema, async (data) => {
  return NextResponse.json({ success: true, data: validateIp(data.ip) });
});
