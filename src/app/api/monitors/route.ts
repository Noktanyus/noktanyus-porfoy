/**
 * GET /api/monitors — kullanıcının tüm monitörlerini listele
 * POST /api/monitors — yeni monitör oluştur (rate limited)
 */

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';
import { withRateLimit } from '@/lib/rateLimitMiddleware';
import { RateLimits } from '@/lib/rateLimit';
import { monitoringService } from '@/modules/monitoring';
import { CreateMonitorSchema } from '@/modules/monitoring/schemas';
import type { ApiSuccess } from '@/lib/apiResponse';

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
    const monitors = await monitoringService.listMonitors(userId);
    return ok(monitors);
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
    const data = CreateMonitorSchema.parse(body);
    const monitor = await monitoringService.createMonitor(userId, data);
    return ok(monitor, { status: 201 });
  });
}

export const POST = withRateLimit(RateLimits.api, createHandler);
