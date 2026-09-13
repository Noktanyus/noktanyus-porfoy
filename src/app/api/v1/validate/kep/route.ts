import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTrApi } from '@/modules/tr-api/routeHelper';
import { validateKep } from '@/modules/tr-api';

const BodySchema = z.object({ kep: z.string().min(8).max(254) });

export const POST = withTrApi(BodySchema, async (data) => {
  return NextResponse.json({ success: true, data: validateKep(data.kep) });
});
