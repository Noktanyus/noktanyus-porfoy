/**
 * Admin Analytics — CLV API
 *
 * GET — Customer Lifetime Value: en degerli musteriler + ortalama CLV.
 *
 * Query: ?limit=50 (1-500, varsayilan 50)
 * Auth: NextAuth session + admin rolu zorunlu.
 */

import type { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { analyticsService } from '@/modules/analytics/service';
import { ok, withErrorHandling } from '@/lib/apiResponse';
import { UnauthorizedError, ForbiddenError } from '@/lib/errors';

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new UnauthorizedError('Giriş gerekli');
    }
    if (session.user.role !== 'admin') {
      throw new ForbiddenError('Yetkisiz erişim');
    }

    const limitParam = req.nextUrl.searchParams.get('limit');
    const clv = await analyticsService.getCLV({
      limit: limitParam ? Number(limitParam) : undefined,
    });

    return ok(clv);
  });
}
