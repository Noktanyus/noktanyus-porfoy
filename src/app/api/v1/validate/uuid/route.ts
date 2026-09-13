import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTrApi } from '@/modules/tr-api/routeHelper';
import { validateUuid } from '@/modules/tr-api';

const BodySchema = z.object({ uuid: z.string().min(32).max(40) });

export const POST = withTrApi(BodySchema, async (data) => {
  return NextResponse.json({ success: true, data: validateUuid(data.uuid) });
});
