/**
 * POST /api/user/loyalty/redeem — ödül kullan
 */

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ok, withErrorHandling } from '@/lib/apiResponse';
import {
  UnauthorizedError,
  NotFoundError,
  ValidationError,
} from '@/modules/shared/errors';

export const dynamic = 'force-dynamic';

const BodySchema = z.object({
  rewardId: z.string().min(1),
});

const TIER_ORDER = ['bronze', 'silver', 'gold', 'platinum'];

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new UnauthorizedError('Giriş gerekli');
    const userId = (session.user as { id: string }).id;

    const json = await req.json().catch(() => null);
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      throw new ValidationError('Geçersiz istek', parsed.error.flatten());
    }

    const reward = await prisma.loyaltyReward.findFirst({
      where: { id: parsed.data.rewardId, active: true },
    });
    if (!reward) throw new NotFoundError('Ödül bulunamadı');

    const result = await prisma.$transaction(async (tx) => {
      let account = await tx.loyaltyAccount.findUnique({ where: { userId } });
      if (!account) {
        account = await tx.loyaltyAccount.create({ data: { userId } });
      }

      const userTier = TIER_ORDER.indexOf(account.tier);
      const needTier = TIER_ORDER.indexOf(reward.tier);
      if (needTier > userTier) {
        throw new ValidationError(`Bu ödül için ${reward.tier} seviyesi gerekli`);
      }
      if (account.points < reward.pointsCost) {
        throw new ValidationError('Yetersiz puan');
      }
      if (reward.stock != null && reward.stock <= 0) {
        throw new ValidationError('Ödül stoku tükendi');
      }

      const newPoints = account.points - reward.pointsCost;
      const updated = await tx.loyaltyAccount.update({
        where: { id: account.id },
        data: { points: newPoints },
      });

      await tx.loyaltyTransaction.create({
        data: {
          accountId: account.id,
          type: 'redeem',
          points: -reward.pointsCost,
          balance: newPoints,
          reason: `Ödül: ${reward.name}`,
          reference: reward.id,
        },
      });

      if (reward.stock != null) {
        await tx.loyaltyReward.update({
          where: { id: reward.id },
          data: { stock: { decrement: 1 } },
        });
      }

      return { account: updated, reward };
    });

    return ok({
      points: result.account.points,
      rewardId: result.reward.id,
      rewardName: result.reward.name,
    });
  });
}
