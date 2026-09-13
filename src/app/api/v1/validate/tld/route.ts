import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTrApi } from '@/modules/tr-api/routeHelper';
import { validateDomainTld } from '@/modules/tr-api';

const BodySchema = z.object({
  domain: z.string().min(3).max(253),
});

export const POST = withTrApi(BodySchema, async (data) => {
  return NextResponse.json({ success: true, data: validateDomainTld(data.domain) });
});
