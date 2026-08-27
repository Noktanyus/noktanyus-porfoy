/**
 * User Notifications — GET
 *
 * Kullanıcının tüm bildirimlerini ve okunmamış sayısını döner.
 */

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { notificationService } from '@/modules/notifications';
import { ok, withErrorHandling } from '@/lib/apiResponse';
import { UnauthorizedError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new UnauthorizedError('Giriş gerekli');
    const userId = (session.user as any).id;
    if (!userId) throw new UnauthorizedError('Giriş gerekli');

    const [notifications, unreadCount] = await Promise.all([
      notificationService.list(userId, 50),
      notificationService.unreadCount(userId),
    ]);

    return ok({ notifications, unreadCount });
  });
}
