/**
 * POST /api/conversions/[name]
 * - Bir experiment icin conversion (donusum) event'i kaydeder.
 * - Body: { sessionId: string, value?: number, userId?: string, metadata?: object }
 * - Ayni session'in mevcut sticky variant'ina baglanir.
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { abTestService } from '@/modules/ab-testing/abTestService';
import { ok, withErrorHandling } from '@/lib/apiResponse';

const BodySchema = z.object({
  sessionId: z.string().min(1, 'sessionId zorunlu'),
  value: z.number().optional(),
  userId: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { name: string } }
) {
  return withErrorHandling(async () => {
    const body = await req.json();
    const { sessionId, value, userId, metadata } = BodySchema.parse(body);

    const success = await abTestService.trackConversion(
      params.name,
      sessionId,
      value,
      userId,
      metadata
    );

    return ok({ success, experiment: params.name });
  });
}
