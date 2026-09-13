import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTrApi } from '@/modules/tr-api/routeHelper';
import { detectCardBrand, validateCardLuhn } from '@/modules/tr-api';

const BodySchema = z.object({ cardNumber: z.string().min(13).max(32) });

export const POST = withTrApi(BodySchema, async (data) => {
  const brand = detectCardBrand(data.cardNumber);
  const luhn = validateCardLuhn(data.cardNumber);
  return NextResponse.json({ success: true, data: { ...brand, luhnValid: luhn.valid } });
});
