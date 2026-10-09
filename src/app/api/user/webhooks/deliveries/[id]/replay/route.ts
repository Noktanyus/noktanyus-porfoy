/**
 * POST /api/user/webhooks/deliveries/[id]/replay
 * Dead letter / başarısız teslimatı yeniden gönder.
 */

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { webhookService } from '@/modules/webhooks';
import { ok, withErrorHandling } from '@/lib/apiResponse';
import { UnauthorizedError } from '@/modules/shared/errors';

export const dynamic = 'force-dynamic';

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new UnauthorizedError('Giriş gerekli');
    const userId = (session.user as { id: string }).id;

    const result = await webhookService.replayDelivery(userId, params.id);
    const d = result.delivery;

    return ok({
      replayedFrom: result.replayedFrom,
      delivery: d
        ? {
            id: d.id,
            status: d.status,
            attempts: d.attempts,
            responseStatus: d.responseStatus,
            errorMessage: d.errorMessage,
            deliveredAt: d.deliveredAt?.toISOString() ?? null,
          }
        : null,
    });
  });
}
