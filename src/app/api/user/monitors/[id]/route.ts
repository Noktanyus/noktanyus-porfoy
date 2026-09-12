/**
 * @file User Monitor — Single Resource Endpoint
 * @description GET: tek monitörü getir.
 *              Phase 4 C.8: KVKK Madde 11 — kişisel veri erişimi audit.
 */

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ok, withErrorHandling } from '@/lib/apiResponse';
import { UnauthorizedError, NotFoundError } from '@/modules/shared/errors';
import { logDataAccess } from '@/lib/audit';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new UnauthorizedError('Giriş gerekli');
    const userId = (session.user as any).id as string;

    const monitor = await prisma.monitor.findFirst({
      where: { id: params.id, userId },
      include: {
        _count: { select: { checks: true, incidents: true } },
        incidents: {
          orderBy: { startedAt: 'desc' },
          take: 10,
        },
      },
    });
    if (!monitor) throw new NotFoundError('Monitör bulunamadı');

    // Phase 4 C.8 — KVKK Madde 11: kişisel veri erişimi audit
    logDataAccess({
      userId,
      resource: 'monitor',
      resourceId: params.id,
      ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? undefined,
      userAgent: req.headers.get('user-agent') ?? undefined,
    });

    return ok({ monitor });
  });
}
