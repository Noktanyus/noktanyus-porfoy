/**
 * GET /api/user/usage — kullanıcı API kullanım özeti
 * Query: hours=24|72|168
 */

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { apiKeyService } from '@/modules/api-keys/service';
import { ok, withErrorHandling } from '@/lib/apiResponse';
import { UnauthorizedError } from '@/modules/shared/errors';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new UnauthorizedError('Giriş gerekli');
    const userId = (session.user as { id: string }).id;

    const hoursParam = Number(req.nextUrl.searchParams.get('hours') ?? '24');
    const hours = Number.isFinite(hoursParam) ? hoursParam : 24;
    const overview = await apiKeyService.getUserUsageOverview(userId, hours);

    return ok({
      ...overview,
      recent: overview.recent.map((r) => ({
        ...r,
        timestamp: r.timestamp.toISOString(),
      })),
      keys: overview.keys.map((k) => ({
        ...k,
        lastUsedAt: k.lastUsedAt ? k.lastUsedAt.toISOString() : null,
      })),
    });
  });
}
