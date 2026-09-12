/**
 * @file User Order — Single Resource Endpoint
 * @description GET: tek siparişi getir.
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

    const order = await prisma.order.findFirst({
      where: {
        id: params.id,
        OR: [{ userId }, { customer: { userId } }],
      },
      include: {
        items: { include: { product: { select: { slug: true, title: true, thumbnail: true } } } },
        licenses: true,
        coupon: { select: { code: true, description: true, discountType: true, discountValue: true } },
        affiliateCommission: true,
      },
    });
    if (!order) throw new NotFoundError('Sipariş bulunamadı');

    // Phase 4 C.8 — KVKK Madde 11: kişisel veri erişimi audit
    logDataAccess({
      userId,
      resource: 'order',
      resourceId: params.id,
      ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? undefined,
      userAgent: req.headers.get('user-agent') ?? undefined,
    });

    return ok({ order });
  });
}
