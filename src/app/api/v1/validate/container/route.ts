import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTrApi } from '@/modules/tr-api/routeHelper';
import { validateContainer } from '@/modules/tr-api';

const BodySchema = z.object({ number: z.string().min(10).max(20) });

export const POST = withTrApi(BodySchema, async (data) => {
  return NextResponse.json({ success: true, data: validateContainer(data.number) });
});
