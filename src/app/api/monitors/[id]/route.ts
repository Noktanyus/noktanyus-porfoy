/**
 * GET /api/monitors/[id] — monitör detayı
 * PATCH /api/monitors/[id] — monitör güncelle
 * DELETE /api/monitors/[id] — monitör sil
 */

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';
import { withRateLimit } from '@/lib/rateLimitMiddleware';
import { RateLimits } from '@/lib/rateLimit';
import { monitoringService } from '@/modules/monitoring';
import { UpdateMonitorSchema } from '@/modules/monitoring/schemas';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling<unknown>(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return fail({ code: 'UNAUTHORIZED', message: 'Giriş gerekli', statusCode: 401 } as any);
    }
    const userId = (session.user as any).id;
    if (!userId) {
      return fail({ code: 'UNAUTHORIZED', message: 'Geçersiz oturum', statusCode: 401 } as any);
    }
    const monitor = await monitoringService.getMonitor(userId, params.id);
    return ok(monitor);
  });
}

async function patchHandler(req: NextRequest, ctx: { params: { id: string } }) {
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
    const data = UpdateMonitorSchema.parse(body);
    const monitor = await monitoringService.updateMonitor(userId, ctx.params.id, data);
    return ok(monitor);
  });
}

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
    await monitoringService.deleteMonitor(userId, ctx.params.id);
    return ok({ success: true });
  });
}

export const PATCH = withRateLimit(RateLimits.api, patchHandler as any);
export const DELETE = withRateLimit(RateLimits.api, deleteHandler as any);
