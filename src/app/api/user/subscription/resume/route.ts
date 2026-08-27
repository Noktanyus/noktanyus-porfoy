/**
 * POST /api/user/subscription/resume
 *
 * Duraklatılmış aboneliği tekrar aktif yapar.
 */

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { subscriptionPauseService } from '@/modules/commerce';
import { ok, withErrorHandling } from '@/lib/apiResponse';
import { UnauthorizedError } from '@/modules/shared/errors';

export const dynamic = 'force-dynamic';

export async function POST(_req: NextRequest) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new UnauthorizedError('Giriş gerekli');
    const userId = (session.user as { id?: string }).id;
    if (!userId) throw new UnauthorizedError('Giriş gerekli');

    const sub = await subscriptionPauseService.resume(userId);
    return ok({ subscription: sub });
  });
}
