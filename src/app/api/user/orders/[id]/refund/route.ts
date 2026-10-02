/**
 * @file route.ts — Kullanıcı Sipariş İade Endpoint'i
 * GET /api/user/orders/[id]/refund — 1 günlük koşulsuz iade uygunluk durumunu sorgular.
 * POST /api/user/orders/[id]/refund — Kredi veya abonelik iade talebini işler.
 *
 * Kurallar:
 * 1. Sipariş ödenmiş olmalı.
 * 2. Yalnızca API Kredi Paketi veya Abonelik alımlarında geçerlidir.
 * 3. Satın alımdan itibaren 24 saat (1 gün) geçmemiş olmalıdır.
 * 4. O dönemde/satın alımdan sonra HİÇBİR hak (API kredisi / abonelik isteği / lisans) kullanılmamış olmalıdır.
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ok, withErrorHandling } from '@/lib/apiResponse';
import { refundService } from '@/modules/commerce/refundService';
import { checkRefundEligibility } from '@/modules/commerce/refundEligibility';
import {
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '@/modules/shared/errors';

const BodySchema = z.object({
  reason: z.string().max(500).optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new UnauthorizedError('Giriş gerekli');
    }
    const userId = (session.user as { id: string }).id;

    // Yetki kontrolü: sipariş sahibi mi?
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      select: { id: true, userId: true, customerEmail: true },
    });
    if (!order) {
      throw new NotFoundError('Sipariş');
    }
    if (order.userId !== userId && order.customerEmail !== session.user.email) {
      throw new ForbiddenError('Bu siparişi görüntüleme yetkiniz yok');
    }

    const eligibility = await checkRefundEligibility(params.id, userId);

    return ok({ eligibility });
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withErrorHandling<unknown>(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new UnauthorizedError('Giriş gerekli');
    }
    const userId = (session.user as { id: string }).id;
    if (!userId) {
      throw new UnauthorizedError('Geçersiz oturum');
    }

    // Body parse
    let body: unknown = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }
    const data = BodySchema.parse(body);

    // Yetki kontrolü: sipariş sahibi mi?
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      select: { id: true, userId: true, customerEmail: true, totalCents: true },
    });
    if (!order) {
      throw new NotFoundError('Sipariş');
    }
    if (order.userId !== userId && order.customerEmail !== session.user.email) {
      throw new ForbiddenError('Bu siparişi iade etme yetkiniz yok');
    }

    // 1 gün & kullanılmamış hak uygunluk kontrolü
    const eligibility = await checkRefundEligibility(params.id, userId);
    if (!eligibility.eligible) {
      throw new ValidationError(
        eligibility.reason || 'İade şartları karşılanmıyor',
        { eligibility }
      );
    }

    const reason =
      data.reason?.trim() ||
      `Kullanıcı iade garantisi: 24 saat içinde kullanılmamış ${
        eligibility.orderType === 'api_topup' ? 'API kredi' : 'abonelik'
      } iadesi`;

    const result = await refundService.createRefund({
      orderId: params.id,
      userId,
      userEmail: session.user.email ?? undefined,
      amountCents: order.totalCents, // Kullanıcı iadesi tam iadedir
      reason,
    });

    return ok({
      refund: result,
      message:
        'İade işleminiz başarıyla tamamlandı. Ödemeniz PayTR üzerinden kartınıza iade edilmiş ve paketiniz iptal edilmiştir.',
    });
  });
}
