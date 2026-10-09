/**
 * User Activity — GET
 *
 * Kullanıcının kendi audit log kayıtlarını döner (KVKK / hesap güvenliği).
 */

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ok, withErrorHandling } from '@/lib/apiResponse';
import { UnauthorizedError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new UnauthorizedError('Giriş gerekli');
    const userId = (session.user as { id?: string }).id;
    if (!userId) throw new UnauthorizedError('Giriş gerekli');

    const limitRaw = Number(req.nextUrl.searchParams.get('limit') ?? '50');
    const limit = Math.min(100, Math.max(1, Number.isFinite(limitRaw) ? limitRaw : 50));

    const logs = await prisma.auditLog.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: limit,
      select: {
        id: true,
        action: true,
        resource: true,
        resourceId: true,
        status: true,
        ipAddress: true,
        timestamp: true,
        errorMessage: true,
      },
    });

    return ok({ activity: logs, count: logs.length });
  });
}
