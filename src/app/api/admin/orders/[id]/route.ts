/**
 * @file /api/admin/orders/[id] - GET, PATCH
 * @description Admin için sipariş detayını getirme ve güncelleme (notlar, durum vb.).
 */

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ok, withErrorHandling } from '@/lib/apiResponse';
import { logAudit } from '@/lib/audit';
import { UnauthorizedError, ForbiddenError, NotFoundError } from '@/modules/shared/errors';

export const dynamic = 'force-dynamic';

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new UnauthorizedError('Giriş gerekli');
  if (session.user.role !== 'admin') {
    throw new ForbiddenError('Bu işlem sadece admin rolü için geçerlidir');
  }
  return session.user;
}

const UpdateOrderSchema = z.object({
  notes: z.string().max(2000).optional(),
  status: z
    .enum([
      'PENDING',
      'PAID',
      'FAILED',
      'REFUNDED',
      'PARTIALLY_REFUNDED',
      'FULFILLED',
      'CANCELED',
    ])
    .optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withErrorHandling(async () => {
    await requireAdmin();

    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        items: { include: { product: true } },
        licenses: true,
        user: { select: { id: true, name: true, email: true, role: true } },
        customer: true,
        coupon: true,
      },
    });

    if (!order) {
      throw new NotFoundError('Sipariş bulunamadı');
    }

    return ok({ order });
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withErrorHandling(async () => {
    const admin = await requireAdmin();
    const body = await req.json();
    const data = UpdateOrderSchema.parse(body);

    const existing = await prisma.order.findUnique({
      where: { id: params.id },
      select: { id: true, orderNumber: true, status: true, notes: true },
    });

    if (!existing) {
      throw new NotFoundError('Sipariş bulunamadı');
    }

    const updated = await prisma.order.update({
      where: { id: params.id },
      data: {
        ...(data.notes !== undefined ? { notes: data.notes } : {}),
        ...(data.status ? { status: data.status } : {}),
      },
      include: {
        items: { include: { product: true } },
        licenses: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });

    await logAudit({
      userId: (admin as { id: string }).id,
      userEmail: admin.email ?? undefined,
      action: 'UPDATE',
      resource: 'Order',
      resourceId: existing.id,
      details: {
        orderNumber: existing.orderNumber,
        previousStatus: existing.status,
        newStatus: data.status ?? existing.status,
        updatedFields: Object.keys(data),
      },
    });

    return ok({ order: updated });
  });
}
