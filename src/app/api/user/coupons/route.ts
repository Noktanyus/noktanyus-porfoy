/**
 * /api/user/coupons
 *   GET — Kullaniciya ozel kuponlari getirir.
 *         - Ilk siparis kuponu (first-time)
 *         - Dogum gunu kuponu (birthday)
 */

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';
import { couponService } from '@/modules/commerce/couponService';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  return withErrorHandling<unknown>(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return ok({ firstTime: [], birthday: null });
    }
    const userId = (session.user as any).id;
    if (!userId) {
      return fail({ code: 'UNAUTHORIZED', message: 'Geçersiz oturum', statusCode: 401 } as any);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { birthDate: true, email: true },
    });

    const [firstTime, birthday] = await Promise.all([
      couponService.getCouponsForFirstTime({ userId, email: user?.email }),
      user?.birthDate ? couponService.getBirthdayCoupon(user.birthDate) : Promise.resolve(null),
    ]);

    return ok({ firstTime, birthday });
  });
}
