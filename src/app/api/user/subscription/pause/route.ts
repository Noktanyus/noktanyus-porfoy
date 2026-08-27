/**
 * POST /api/user/subscription/pause
 *
 * Aktif aboneliği duraklatır. 1-90 gün arası süre verilebilir.
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { subscriptionPauseService } from '@/modules/commerce';
import { ok, withErrorHandling } from '@/lib/apiResponse';
import { UnauthorizedError } from '@/modules/shared/errors';

export const dynamic = 'force-dynamic';

const Schema = z.object({
  durationDays: z.number().int().min(1).max(90),
  reason: z.string().max(500).optional(),
});

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new UnauthorizedError('Giriş gerekli');
    const userId = (session.user as { id?: string }).id;
    if (!userId) throw new UnauthorizedError('Giriş gerekli');

    const body = await req.json().catch(() => ({}));
    const { durationDays, reason } = Schema.parse(body);

    const sub = await subscriptionPauseService.pause(userId, durationDays, reason);
    return ok({ subscription: sub });
  });
}
