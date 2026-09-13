import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTrApi } from '@/modules/tr-api/routeHelper';
import { validateOrcid } from '@/modules/tr-api';

const BodySchema = z.object({
  orcid: z.string().min(10).max(24),
});

export const POST = withTrApi(BodySchema, async (data) => {
  return NextResponse.json({ success: true, data: validateOrcid(data.orcid) });
});
