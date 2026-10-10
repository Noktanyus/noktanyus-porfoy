/**
 * Kota eşiği soft bildirimi (günde en fazla 1).
 * İstek yolunu bloklamaz — fire-and-forget.
 */

import { prisma } from '@/lib/prisma';
import { notificationService } from '@/modules/notifications/service';
import type { QuotaCheckResult } from '@/lib/planGate';
import { logger } from '@/lib/logger';

const WARN_PCT = 80;
const CRITICAL_PCT = 95;

export async function maybeNotifyQuotaThreshold(
  userId: string,
  quota: QuotaCheckResult
): Promise<void> {
  try {
    if (!quota.allowed && quota.billingSource === null) {
      await oncePerDay(userId, 'quota.exhausted', {
        title: 'API kotası tükendi',
        message:
          'Aktif kota veya kredi yok. Plan yükseltin veya kredi yükleyerek isteklere devam edin.',
        link: '/magaza',
        icon: '⚠️',
      });
      return;
    }

    if (quota.billingSource !== 'subscription' || quota.limitRequests <= 0) {
      return;
    }

    const used = Math.max(0, quota.limitRequests - quota.remainingRequests);
    const pct = (used / quota.limitRequests) * 100;

    if (pct >= CRITICAL_PCT) {
      await oncePerDay(userId, 'quota.critical', {
        title: 'Kota kritik seviyede',
        message: `Aylık API kotanızın %${pct.toFixed(0)}'i doldu (${used}/${quota.limitRequests}).`,
        link: '/dashboard/usage',
        icon: '🔴',
      });
      return;
    }

    if (pct >= WARN_PCT) {
      await oncePerDay(userId, 'quota.warn', {
        title: 'Kota uyarısı',
        message: `Aylık API kotanızın %${pct.toFixed(0)}'i doldu. Kullanım projeksiyonuna bakın.`,
        link: '/dashboard/usage',
        icon: '⚡',
      });
    }
  } catch (err) {
    logger.debug('quota alert skipped', { userId, err });
  }
}

async function oncePerDay(
  userId: string,
  type: string,
  data: {
    title: string;
    message: string;
    link?: string;
    icon?: string;
  }
): Promise<void> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const existing = await prisma.notification.findFirst({
    where: { userId, type, createdAt: { gte: since } },
    select: { id: true },
  });
  if (existing) return;
  await notificationService.dispatch(userId, type, data);
}
