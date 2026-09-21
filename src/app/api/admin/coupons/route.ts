/**
 * @file /api/admin/coupons — GET list, POST create
 */

import { NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ok, created, withErrorHandling } from '@/lib/apiResponse';
import { logAudit } from '@/lib/audit';
import { UnauthorizedError, ForbiddenError } from '@/modules/shared/errors';
import { AdminCouponWriteSchema } from '@/modules/commerce/schemas';
import { couponService } from '@/modules/commerce/couponService';

export const dynamic = 'force-dynamic';

function parseOptionalDate(value: string | null | undefined): Date | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return undefined;
  return d;
}

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new UnauthorizedError('Giriş gerekli');
  if (session.user.role !== 'admin') {
    throw new ForbiddenError('Bu işlem sadece admin rolü için geçerlidir');
  }
  return session.user;
}

export async function GET() {
  return withErrorHandling(async () => {
    await requireAdmin();
    const coupons = await couponService.list();
    return ok({ coupons });
  });
}

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const user = await requireAdmin();
    const body = await req.json();
    const data = AdminCouponWriteSchema.parse(body);

    const coupon = await couponService.create({
      code: data.code,
      description: data.description ?? undefined,
      discountType: data.discountType,
      discountValue: data.discountValue,
      minOrderCents: data.minOrderCents,
      maxDiscountCents: data.maxDiscountCents ?? undefined,
      maxUses: data.maxUses ?? undefined,
      maxUsesPerUser: data.maxUsesPerUser,
      startsAt: parseOptionalDate(data.startsAt),
      expiresAt: parseOptionalDate(data.expiresAt),
      active: data.active,
    });

    revalidatePath('/admin/coupons');

    await logAudit({
      userId: user.id,
      userEmail: user.email ?? undefined,
      action: 'CREATE',
      resource: 'Coupon',
      resourceId: coupon.id,
      details: { code: coupon.code },
    });

    return created({ coupon });
  });
}
