/**
 * POST /api/v1/pay/tr-qr/parse — TR Karekod Çözümleyici & Doğrulayıcı
 * Herhangi bir TR Karekod string'ini parçalar, CRC doğrulaması yapar ve IBAN, Tutar, Alıcı bilgilerini ayıklar.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTrApi } from '@/modules/tr-api/routeHelper';
import { parseTrQrString } from '@/modules/tr-api/trQr';

const ParseSchema = z.object({
  payload: z.string().min(10).max(1024),
});

export const POST = withTrApi(ParseSchema, async (data) => {
  const result = parseTrQrString(data.payload);
  return NextResponse.json({
    success: true,
    data: result,
  });
});
