/**
 * @file /api/admin/coupons/[id] — GET, PATCH, DELETE
 */

import { NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ok, withErrorHandling } from '@/lib/apiResponse';
import { logAudit } from '@/lib/audit';
import { UnauthorizedError, ForbiddenError, NotFoundError } from '@/modules/shared/errors';
import { AdminCouponWriteSchema } from '@/modules/commerce/schemas';
import { couponService } from '@/modules/commerce/couponService';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const ToggleSchema = z.object({
  active: z.boolean(),
});

function parseOptionalDate(value: string | null | undefined): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
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

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withErrorHandling(async () => {
    await requireAdmin();
    const coupon = await couponService.findById(params.id);
    if (!coupon) throw new NotFoundError('Kupon');
    return ok({ coupon });
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withErrorHandling(async () => {
    const user = await requireAdmin();
    const body = await req.json();

    if (body && Object.keys(body).length === 1 && typeof body.active === 'boolean') {
      const { active } = ToggleSchema.parse(body);
      const coupon = await couponService.setActive(params.id, active);
      revalidatePath('/admin/coupons');
      await logAudit({
        userId: user.id,
        userEmail: user.email ?? undefined,
        action: 'UPDATE',
        resource: 'Coupon',
        resourceId: coupon.id,
        details: { active },
      });
      return ok({ coupon });
    }

    const data = AdminCouponWriteSchema.parse(body);
    const coupon = await couponService.update(params.id, {
      code: data.code,
      description: data.description ?? null,
      discountType: data.discountType,
      discountValue: data.discountValue,
      minOrderCents: data.minOrderCents,
      maxDiscountCents: data.maxDiscountCents ?? null,
      maxUses: data.maxUses ?? null,
      maxUsesPerUser: data.maxUsesPerUser,
      startsAt: parseOptionalDate(data.startsAt),
      expiresAt: parseOptionalDate(data.expiresAt),
      active: data.active,
    });

    revalidatePath('/admin/coupons');
    await logAudit({
      userId: user.id,
      userEmail: user.email ?? undefined,
      action: 'UPDATE',
      resource: 'Coupon',
      resourceId: coupon.id,
      details: { code: coupon.code },
    });

    return ok({ coupon });
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withErrorHandling(async () => {
    const user = await requireAdmin();
    const deleted = await couponService.remove(params.id);
    revalidatePath('/admin/coupons');
    await logAudit({
      userId: user.id,
      userEmail: user.email ?? undefined,
      action: 'DELETE',
      resource: 'Coupon',
      resourceId: deleted.id,
      details: { code: deleted.code },
    });
    return ok({ success: true, deletedId: deleted.id });
  });
}
