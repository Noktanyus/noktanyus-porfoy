import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTrApi } from '@/modules/tr-api/routeHelper';
import { validatePort } from '@/modules/tr-api';

const BodySchema = z.object({
  port: z.union([z.string().min(1).max(8), z.number()]),
});

export const POST = withTrApi(BodySchema, async (data) => {
  return NextResponse.json({ success: true, data: validatePort(data.port) });
});
