/**
 * POST /api/admin/coupons — Admin kupon oluşturma
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';
import { couponService } from '@/modules/commerce/couponService';
import { UnauthorizedError } from '@/modules/shared/errors';

const CreateSchema = z.object({
  code: z.string().min(3).max(50),
  description: z.string().max(300).optional(),
  discountType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']),
  discountValue: z.number().int().min(1),
  minOrderCents: z.number().int().min(0).optional(),
  maxDiscountCents: z.number().int().min(0).optional().nullable(),
  maxUses: z.number().int().min(1).optional().nullable(),
  maxUsesPerUser: z.number().int().min(1).optional(),
  startsAt: z.string().datetime().optional().nullable(),
  expiresAt: z.string().datetime().optional().nullable(),
});

export async function POST(req: NextRequest) {
  return withErrorHandling<unknown>(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      throw new UnauthorizedError('Admin yetkisi gerekli');
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return fail({
        code: 'VALIDATION_ERROR',
        message: 'Geçersiz JSON gövdesi',
        statusCode: 400,
      } as any);
    }

    const data = CreateSchema.parse(body);

    if (data.discountType === 'PERCENTAGE' && data.discountValue > 100) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: 'Yüzde indirim en fazla 100 olabilir',
        statusCode: 400,
      } as any);
    }

    const coupon = await couponService.create({
      code: data.code,
      description: data.description,
      discountType: data.discountType,
      discountValue: data.discountValue,
      minOrderCents: data.minOrderCents,
      maxDiscountCents: data.maxDiscountCents ?? undefined,
      maxUses: data.maxUses ?? undefined,
      maxUsesPerUser: data.maxUsesPerUser,
      startsAt: data.startsAt ? new Date(data.startsAt) : undefined,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
    });

    revalidatePath('/admin/coupons');
    return ok({ coupon }, { status: 201 });
  });
}
