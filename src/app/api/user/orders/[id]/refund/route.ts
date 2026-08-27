/**
 * POST /api/user/orders/[id]/refund — Sipariş iade talebi oluşturur.
 *
 * Body:
 *   - amountCents?: number (kısmi iade için, belirtilmezse tam iade)
 *   - reason?: string (max 500 karakter)
 *
 * Auth: zorunlu (NextAuth session). Kullanıcı kendi siparişini iade edebilir.
 *
 * Provider tespiti (refundService.detectProvider tarafından yapılır):
 *   - stripePaymentIntent "pi_" ile başlıyorsa → Stripe refund
 *   - aksi halde → iyzico / mock refund
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';
import { refundService } from '@/modules/commerce/refundService';
import { ForbiddenError } from '@/modules/shared/errors';

const BodySchema = z.object({
  amountCents: z.number().int().positive().max(100000000).optional(),
  reason: z.string().max(500).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withErrorHandling<unknown>(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return fail({ code: 'UNAUTHORIZED', message: 'Giriş gerekli', statusCode: 401 } as any);
    }
    const userId = (session.user as { id: string }).id;
    if (!userId) {
      return fail({ code: 'UNAUTHORIZED', message: 'Geçersiz oturum', statusCode: 401 } as any);
    }

    // Body parse
    let body: unknown = {};
    try {
      body = await req.json();
    } catch {
      // Empty body is allowed (full refund)
      body = {};
    }
    const data = BodySchema.parse(body);

    // Yetki kontrolü: sipariş sahibi mi?
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      select: { id: true, userId: true, customerEmail: true },
    });
    if (!order) {
      return fail({ code: 'NOT_FOUND', message: 'Sipariş bulunamadı', statusCode: 404 } as any);
    }
    if (order.userId !== userId && order.customerEmail !== session.user.email) {
      throw new ForbiddenError('Bu siparişi iade etme yetkiniz yok');
    }

    const result = await refundService.createRefund({
      orderId: params.id,
      userId,
      userEmail: session.user.email ?? undefined,
      amountCents: data.amountCents,
      reason: data.reason,
    });

    return ok({ refund: result });
  });
}
