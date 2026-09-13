import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTrApi } from '@/modules/tr-api/routeHelper';
import { validateMersis } from '@/modules/tr-api';

const BodySchema = z.object({ mersis: z.string().min(16).max(20) });

export const POST = withTrApi(BodySchema, async (data) => {
  return NextResponse.json({ success: true, data: validateMersis(data.mersis) });
});
