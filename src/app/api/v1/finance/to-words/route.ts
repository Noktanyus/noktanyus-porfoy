import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTrApi } from '@/modules/tr-api/routeHelper';
import { amountToTurkishWords } from '@/modules/tr-api';

const BodySchema = z.object({
  amountCents: z.number().int().nonnegative().max(100_000_000_00),
  currency: z.enum(['TRY', 'USD', 'EUR', 'GBP']).optional(),
  uppercaseCompact: z.boolean().optional(),
});

export const POST = withTrApi(BodySchema, async (data) => {
  const result = amountToTurkishWords(data);
  return NextResponse.json({ success: true, data: result });
});
