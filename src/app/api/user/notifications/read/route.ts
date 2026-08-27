/**
 * User Notifications — Mark as Read (PATCH)
 *
 * Belirli bildirimleri veya tümünü okundu olarak işaretler.
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { notificationService } from '@/modules/notifications';
import { ok, withErrorHandling } from '@/lib/apiResponse';
import { UnauthorizedError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

const BodySchema = z.object({
  ids: z.array(z.string()).optional(),
  all: z.boolean().optional(),
});

export async function PATCH(req: NextRequest) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new UnauthorizedError('Giriş gerekli');
    const userId = (session.user as any).id;
    if (!userId) throw new UnauthorizedError('Giriş gerekli');

    const body = await req.json();
    const { ids, all } = BodySchema.parse(body);

    if (all) {
      await notificationService.markAllRead(userId);
    } else if (ids && ids.length) {
      await notificationService.markRead(userId, ids);
    }

    return ok({ success: true });
  });
}
