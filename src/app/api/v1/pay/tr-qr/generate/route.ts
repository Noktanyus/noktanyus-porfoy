/**
 * POST /api/v1/pay/tr-qr/generate — TCMB FAST TR Karekod Üretici
 * EMVCo Merchant-Presented Mode standardında karekod string, SVG ve PNG data URL üretir.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTrApi } from '@/modules/tr-api/routeHelper';
import { buildTrQrString, generateTrQrSvg, generateTrQrDataUrl } from '@/modules/tr-api/trQr';

const GenerateSchema = z.object({
  iban: z.string().min(15).max(34),
  payeeName: z.string().min(2).max(70),
  amount: z.union([z.number().positive(), z.string()]).optional(),
  reference: z.string().max(50).optional(),
  city: z.string().max(30).optional(),
  type: z.enum(['dynamic', 'static']).optional(),
  format: z.enum(['all', 'svg', 'dataUrl', 'payload']).optional().default('all'),
});

export const POST = withTrApi(GenerateSchema, async (data) => {
  const buildResult = buildTrQrString({
    iban: data.iban,
    payeeName: data.payeeName,
    amount: data.amount,
    reference: data.reference,
    city: data.city,
    type: data.type,
  });

  let svg: string | undefined;
  let dataUrl: string | undefined;

  if (data.format === 'all' || data.format === 'svg') {
    svg = await generateTrQrSvg({
      iban: data.iban,
      payeeName: data.payeeName,
      amount: data.amount,
      reference: data.reference,
      city: data.city,
      type: data.type,
    });
  }

  if (data.format === 'all' || data.format === 'dataUrl') {
    dataUrl = await generateTrQrDataUrl({
      iban: data.iban,
      payeeName: data.payeeName,
      amount: data.amount,
      reference: data.reference,
      city: data.city,
      type: data.type,
    });
  }

  return NextResponse.json({
    success: true,
    data: {
      ...buildResult,
      svg,
      dataUrl,
    },
  });
});
