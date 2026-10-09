/**
 * POST /api/v1/pay/qr — FAST / TR Karekod P2P payload (metin)
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTrApi } from '@/modules/tr-api/routeHelper';
import { buildTrKarekodP2P } from '@/modules/tr-api/builders';

const BodySchema = z.object({
  iban: z.string().min(1).max(40),
  name: z.string().min(2).max(40),
  amountTry: z.number().positive().max(1_000_000_000).optional(),
  explanation: z.string().max(40).optional(),
  generatorCode: z.string().max(8).optional(),
});

export const POST = withTrApi(BodySchema, async (data) => {
  const result = buildTrKarekodP2P(data);
  if (!result.ok) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION', message: result.reason } },
      { status: 400 }
    );
  }
  return NextResponse.json({ success: true, data: result });
});
