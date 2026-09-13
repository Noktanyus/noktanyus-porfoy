import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTrApi } from '@/modules/tr-api/routeHelper';
import { validateSemver } from '@/modules/tr-api';

const BodySchema = z.object({
  version: z.string().min(1).max(64),
});

export const POST = withTrApi(BodySchema, async (data) => {
  return NextResponse.json({ success: true, data: validateSemver(data.version) });
});
