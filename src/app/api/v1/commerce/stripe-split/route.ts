import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTrApi } from '@/modules/tr-api/routeHelper';
import { stripeConnectSplit } from '@/modules/tr-api';

const BodySchema = z.object({
  chargeCents: z.number().int().nonnegative(),
  applicationFeeCents: z.number().int().nonnegative().optional(),
  stripeFeeCents: z.number().int().nonnegative().optional(),
});

export const POST = withTrApi(BodySchema, async (data) => {
  return NextResponse.json({ success: true, data: stripeConnectSplit(data) });
});
