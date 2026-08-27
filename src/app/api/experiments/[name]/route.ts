/**
 * POST /api/experiments/[name]
 * - Variant exposure tracking. Sticky olarak session'a bagli variant atar.
 * - Body'den sessionId / userId alir. Yoksa otomatik UUID uretir.
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { abTestService } from '@/modules/ab-testing/abTestService';
import { ok, withErrorHandling } from '@/lib/apiResponse';

const BodySchema = z.object({
  sessionId: z.string().min(1).optional(),
  userId: z.string().optional(),
}).optional();

export async function POST(
  req: NextRequest,
  { params }: { params: { name: string } }
) {
  return withErrorHandling(async () => {
    // Body'yi opsiyonel olarak parse et (bos body de kabul edilir)
    let sessionId: string | undefined;
    let userId: string | undefined;

    try {
      const text = await req.text();
      if (text) {
        const json = JSON.parse(text);
        const parsed = BodySchema.parse(json);
        if (parsed) {
          sessionId = parsed.sessionId;
          userId = parsed.userId;
        }
      }
    } catch {
      // Body opsiyonel, gecersiz body kabul edilir
    }

    if (!sessionId) {
      sessionId = req.headers.get('x-session-id') ?? crypto.randomUUID();
    }
    if (!userId) {
      userId = req.headers.get('x-user-id') ?? undefined;
    }

    const result = await abTestService.trackExposure(params.name, sessionId, userId);

    if (!result) {
      // Experiment yoksa veya calismiyorsa: null don, sessizce fail.
      return ok({ variantId: null as string | null, config: {} as Record<string, unknown>, sessionId, active: false });
    }

    return ok({
      variantId: result.variantId,
      config: result.config,
      sessionId,
      active: true,
    });
  });
}
