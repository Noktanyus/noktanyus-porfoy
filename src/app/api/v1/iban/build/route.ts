/**
 * POST /api/v1/iban/build — banka kodu + hesaptan TR IBAN üret
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTrApi } from '@/modules/tr-api/routeHelper';
import { buildTurkishIban } from '@/modules/tr-api/builders';

const BodySchema = z.object({
  bankCode: z.string().min(1).max(8),
  accountNumber: z.string().min(1).max(32),
  reservedDigit: z.string().max(1).optional(),
});

export const POST = withTrApi(BodySchema, async (data) => {
  const result = buildTurkishIban(data);
  if (!result.ok) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION', message: result.reason } },
      { status: 400 }
    );
  }
  return NextResponse.json({ success: true, data: result });
});
