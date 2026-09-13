import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTrApi } from '@/modules/tr-api/routeHelper';
import { validateIssn } from '@/modules/tr-api';

const BodySchema = z.object({ issn: z.string().min(8).max(16) });

export const POST = withTrApi(BodySchema, async (data) => {
  return NextResponse.json({ success: true, data: validateIssn(data.issn) });
});
