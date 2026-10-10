/**
 * POST /api/v1/cargo/detect — Türkiye kargo takip no & taşıyıcı tespiti
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTrApi } from '@/modules/tr-api/routeHelper';
import { detectCargoCarrier } from '@/modules/tr-api';

const BodySchema = z.object({
  trackingNumber: z.string().min(3).max(40),
});

export const POST = withTrApi(BodySchema, async (data) => {
  const result = detectCargoCarrier(data.trackingNumber);
  return NextResponse.json({ success: true, data: result });
});
