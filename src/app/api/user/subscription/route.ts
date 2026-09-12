/**
 * @file User Subscription — Current Subscription Endpoint
 * @description GET: kullanıcının aktif aboneliğini getir.
 *              Phase 4 C.8: KVKK Madde 11 — kişisel veri erişimi audit.
 */

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ok, withErrorHandling } from '@/lib/apiResponse';
import { UnauthorizedError } from '@/modules/shared/errors';
import { logDataAccess } from '@/lib/audit';

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new UnauthorizedError('Giriş gerekli');
    const userId = (session.user as any).id as string;

    // Aktif + duraklatılmış abonelikleri getir (expired hariç)
    const subscriptions = await prisma.userSubscription.findMany({
      where: {
        userId,
        OR: [
          { status: 'active' },
          { status: 'paused' },
          { status: 'trial' },
        ],
      },
      orderBy: { expiresAt: 'desc' },
    });

    // Phase 4 C.8 — KVKK Madde 11: kişisel veri erişimi audit
    logDataAccess({
      userId,
      resource: 'subscription',
      resourceId: subscriptions[0]?.id,
      ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? undefined,
      userAgent: req.headers.get('user-agent') ?? undefined,
    });

    return ok({ subscriptions });
  });
}
