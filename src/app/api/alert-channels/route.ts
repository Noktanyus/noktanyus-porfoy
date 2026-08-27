/**
 * GET /api/alert-channels — kullanıcının alert kanallarını listele
 * POST /api/alert-channels — yeni alert kanalı oluştur
 */

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';
import { withRateLimit } from '@/lib/rateLimitMiddleware';
import { RateLimits } from '@/lib/rateLimit';
import { monitoringService } from '@/modules/monitoring';
import { CreateAlertChannelSchema } from '@/modules/monitoring/schemas';

export async function GET(_req: NextRequest) {
  return withErrorHandling<unknown>(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return fail({ code: 'UNAUTHORIZED', message: 'Giriş gerekli', statusCode: 401 } as any);
    }
    const userId = (session.user as any).id;
    if (!userId) {
      return fail({ code: 'UNAUTHORIZED', message: 'Geçersiz oturum', statusCode: 401 } as any);
    }
    const channels = await monitoringService.listAlertChannels(userId);
    return ok(channels);
  });
}

async function createHandler(req: NextRequest) {
  return withErrorHandling<unknown>(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return fail({ code: 'UNAUTHORIZED', message: 'Giriş gerekli', statusCode: 401 } as any);
    }
    const userId = (session.user as any).id;
    if (!userId) {
      return fail({ code: 'UNAUTHORIZED', message: 'Geçersiz oturum', statusCode: 401 } as any);
    }
    const body = await req.json();
    const data = CreateAlertChannelSchema.parse(body);
    const channel = await monitoringService.createAlertChannel(userId, data);
    return ok(channel, { status: 201 });
  });
}

export const POST = withRateLimit(RateLimits.api, createHandler);
