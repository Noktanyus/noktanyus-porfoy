/**
 * POST /api/v1/finance/legal-interest — TCMB Yasal & Ticari Temerrüt Faizi Hesaplama API
 * 3095 s.K. ve TTK m.1530 uyarınca kademeli tarihsel faiz tahakkuku.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTrApi } from '@/modules/tr-api/routeHelper';
import { calculateLegalInterest } from '@/modules/tr-api/legalInterest';

const LegalInterestSchema = z.object({
  principal: z.number().positive(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Tarih formatı YYYY-MM-DD olmalıdır'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Tarih formatı YYYY-MM-DD olmalıdır'),
  interestType: z.enum(['legal', 'commercial_default', 'custom']).default('commercial_default'),
  customRate: z.number().min(0).max(500).optional(),
});

export const POST = withTrApi(LegalInterestSchema, async (data) => {
  const result = calculateLegalInterest({
    principal: data.principal,
    startDate: data.startDate,
    endDate: data.endDate,
    interestType: data.interestType,
    customRate: data.customRate,
  });

  return NextResponse.json({
    success: true,
    data: result,
  });
});
