/**
 * @file /api/admin/orders/[id]/refund - POST
 * @description Admin tarafından sipariş iadesi başlatma endpoint'i (PayTR İade API).
 */

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { ok, withErrorHandling } from '@/lib/apiResponse';
import { refundService } from '@/modules/commerce/refundService';
import { UnauthorizedError, ForbiddenError } from '@/modules/shared/errors';

export const dynamic = 'force-dynamic';

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new UnauthorizedError('Giriş gerekli');
  if (session.user.role !== 'admin') {
    throw new ForbiddenError('Bu işlem sadece admin rolü için geçerlidir');
  }
  return session.user;
}

const RefundSchema = z.object({
  amountCents: z.number().int().positive().max(100000000).optional(),
  reason: z.string().max(500).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withErrorHandling(async () => {
    const admin = await requireAdmin();

    let body: unknown = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }
    const data = RefundSchema.parse(body);

    const result = await refundService.createRefund({
      orderId: params.id,
      userId: (admin as { id: string }).id,
      userEmail: admin.email ?? undefined,
      amountCents: data.amountCents,
      reason: data.reason || 'Admin tarafından iade edildi',
    });

    return ok({ refund: result });
  });
}
