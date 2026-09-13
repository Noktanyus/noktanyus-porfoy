import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTrApi } from '@/modules/tr-api/routeHelper';
import { resolveIbanBank } from '@/modules/tr-api';

const BodySchema = z.object({
  iban: z.string().min(1).max(40),
});

export const POST = withTrApi(BodySchema, async (data) => {
  const result = resolveIbanBank(data.iban);
  return NextResponse.json({ success: true, data: result });
});
