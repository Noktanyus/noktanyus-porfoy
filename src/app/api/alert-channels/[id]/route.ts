/**
 * DELETE /api/alert-channels/[id] — alert kanalı sil
 */

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';
import { withRateLimit } from '@/lib/rateLimitMiddleware';
import { RateLimits } from '@/lib/rateLimit';
import { monitoringService } from '@/modules/monitoring';

async function deleteHandler(req: NextRequest, ctx: { params: { id: string } }) {
  return withErrorHandling<unknown>(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return fail({ code: 'UNAUTHORIZED', message: 'Giriş gerekli', statusCode: 401 } as any);
    }
    const userId = (session.user as any).id;
    if (!userId) {
      return fail({ code: 'UNAUTHORIZED', message: 'Geçersiz oturum', statusCode: 401 } as any);
    }
    await monitoringService.deleteAlertChannel(userId, ctx.params.id);
    return ok({ success: true });
  });
}

export const DELETE = withRateLimit(RateLimits.api, deleteHandler as any);
