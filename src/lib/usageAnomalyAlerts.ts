/**
 * Kullanım anomalisi soft bildirimi (günde en fazla 1 / tip).
 * Dashboard /usage yüklenirken fire-and-forget + banner için anomali döner.
 */

import { prisma } from '@/lib/prisma';
import { notificationService } from '@/modules/notifications/service';
import { logger } from '@/lib/logger';
import {
  detectUsageAnomalies,
  type UsageAnomaly,
} from '@/lib/usageAnomaly';

const BASELINE_HOURS = 24;

async function activeKeyIds(userId: string): Promise<string[]> {
  const keys = await prisma.apiKey.findMany({
    where: { userId, revokedAt: null },
    select: { id: true },
  });
  return keys.map((k) => k.id);
}

/** Son `hours` saatlik istek sayıları (en yeni önce). */
export async function getUserHourlyRequestCounts(
  userId: string,
  hours: number,
  keyIds?: string[]
): Promise<number[]> {
  const ids = keyIds ?? (await activeKeyIds(userId));
  if (ids.length === 0) {
    return Array.from({ length: hours }, () => 0);
  }

  const now = Date.now();
  return Promise.all(
    Array.from({ length: hours }, (_, i) => {
      const end = new Date(now - i * 60 * 60 * 1000);
      const start = new Date(end.getTime() - 60 * 60 * 1000);
      return prisma.apiKeyUsage.count({
        where: {
          apiKeyId: { in: ids },
          timestamp: { gte: start, lt: end },
        },
      });
    })
  );
}

function utcDayBounds(now = new Date()): {
  todayStart: Date;
  yesterdayStart: Date;
  tomorrowStart: Date;
} {
  const todayStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
  const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
  const tomorrowStart = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
  return { todayStart, yesterdayStart, tomorrowStart };
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

/**
 * Anomalileri hesapla, soft bildirim yaz, banner için listeyi döndür.
 */
export async function evaluateAndNotifyUsageAnomalies(
  userId: string,
  opts: { isPaidPlan: boolean }
): Promise<UsageAnomaly[]> {
  try {
    const keyIds = await activeKeyIds(userId);
    const { todayStart, yesterdayStart, tomorrowStart } = utcDayBounds();

    const [hourly, yesterdayCount, todayCount] = await Promise.all([
      getUserHourlyRequestCounts(userId, BASELINE_HOURS + 1, keyIds),
      keyIds.length === 0
        ? Promise.resolve(0)
        : prisma.apiKeyUsage.count({
            where: {
              apiKeyId: { in: keyIds },
              timestamp: { gte: yesterdayStart, lt: todayStart },
            },
          }),
      keyIds.length === 0
        ? Promise.resolve(0)
        : prisma.apiKeyUsage.count({
            where: {
              apiKeyId: { in: keyIds },
              timestamp: { gte: todayStart, lt: tomorrowStart },
            },
          }),
    ]);

    const anomalies = detectUsageAnomalies({
      hourlyCountsNewestFirst: hourly,
      baselineHours: BASELINE_HOURS,
      spikeMultiplier: 3,
      yesterdayCount,
      todayCount,
      isPaidPlan: opts.isPaidPlan,
    });

    for (const a of anomalies) {
      if (a.kind === 'spike') {
        void oncePerDay(userId, 'usage.spike', {
          title: 'Kullanım artışı',
          message: a.message,
          link: '/dashboard/usage',
          icon: '📈',
        }).catch((err) => logger.debug('usage spike alert skipped', { userId, err }));
      } else if (a.kind === 'silence') {
        void oncePerDay(userId, 'usage.silence', {
          title: 'API sessizliği',
          message: a.message,
          link: '/dashboard/usage',
          icon: '🔇',
        }).catch((err) =>
          logger.debug('usage silence alert skipped', { userId, err })
        );
      }
    }

    return anomalies;
  } catch (err) {
    logger.debug('usage anomaly evaluate skipped', { userId, err });
    return [];
  }
}
