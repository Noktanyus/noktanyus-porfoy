/**
 * Subscription Pause/Resume Service
 *
 * UserSubscription üzerinde pause/resume işlemlerini yönetir:
 * - pause(): aktif aboneliği duraklatır (max 90 gün)
 * - resume(): duraklatılmış aboneliği aktif yapar
 * - autoResumeDue(): süresi dolmuş pause'ları otomatik aktif yapar (cron için)
 * - isPaused(): kullanıcının duraklatılmış aboneliği var mı kontrol eder
 *
 * Pause geçmişi JSON olarak tutulur (pauseHistory).
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { NotFoundError, ValidationError } from '@/modules/shared/errors';

export const MAX_PAUSE_DAYS = 90;

interface PauseHistoryEntry {
  pausedAt: string;
  resumedAt?: string;
  reason?: string;
  durationDays: number;
}

function readHistory(value: unknown): PauseHistoryEntry[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (e): e is PauseHistoryEntry =>
      typeof e === 'object' && e !== null && 'pausedAt' in e
  );
}

export const subscriptionPauseService = {
  /**
   * Aktif aboneliği belirtilen süre kadar duraklatır (1-90 gün).
   * pauseHistory alanına yeni pause kaydı eklenir.
   */
  async pause(userId: string, durationDays: number, reason?: string) {
    if (!Number.isInteger(durationDays) || durationDays < 1 || durationDays > MAX_PAUSE_DAYS) {
      throw new ValidationError(
        `Pause süresi 1-${MAX_PAUSE_DAYS} gün arasında olmalı`,
        { durationDays }
      );
    }

    const sub = await prisma.userSubscription.findFirst({
      where: { userId, status: 'active' },
    });
    if (!sub) throw new NotFoundError('Aktif abonelik');

    if (sub.status === 'paused') {
      throw new ValidationError('Zaten duraklatılmış bir aboneliğiniz var');
    }

    const pauseEndsAt = new Date(Date.now() + durationDays * 86_400_000);
    const pausedAt = new Date();
    const history = readHistory(sub.pauseHistory);

    const entry: PauseHistoryEntry = {
      pausedAt: pausedAt.toISOString(),
      reason,
      durationDays,
    };

    const updated = await prisma.userSubscription.update({
      where: { id: sub.id },
      data: {
        status: 'paused',
        pauseEndsAt,
        pauseReason: reason ?? null,
        pausedAt,
        pauseHistory: [...history, entry] as unknown as object,
      },
    });

    logger.info('Subscription paused', {
      userId,
      subscriptionId: sub.id,
      durationDays,
      pauseEndsAt: pauseEndsAt.toISOString(),
    });

    return updated;
  },

  /**
   * Duraklatılmış aboneliği tekrar aktif yapar.
   * Son pause kaydına resumedAt eklenir.
   */
  async resume(userId: string) {
    const sub = await prisma.userSubscription.findFirst({
      where: { userId, status: 'paused' },
    });
    if (!sub) throw new NotFoundError('Duraklatılmış abonelik');

    const history = readHistory(sub.pauseHistory);
    const resumedAt = new Date();
    const newHistory = history.map((entry, idx) =>
      idx === history.length - 1
        ? { ...entry, resumedAt: resumedAt.toISOString() }
        : entry
    );

    const updated = await prisma.userSubscription.update({
      where: { id: sub.id },
      data: {
        status: 'active',
        pausedAt: null,
        pauseEndsAt: null,
        pauseReason: null,
        pauseHistory: newHistory as unknown as object,
      },
    });

    logger.info('Subscription resumed', {
      userId,
      subscriptionId: sub.id,
    });

    return updated;
  },

  /**
   * pauseEndsAt süresi geçmiş tüm abonelikleri otomatik aktif yapar.
   * Cron job tarafından günlük çağrılır.
   */
  async autoResumeDue(): Promise<number> {
    const now = new Date();
    const due = await prisma.userSubscription.findMany({
      where: {
        status: 'paused',
        pauseEndsAt: { lte: now },
      },
    });

    for (const sub of due) {
      const history = readHistory(sub.pauseHistory);
      const newHistory = history.map((entry, idx) =>
        idx === history.length - 1
          ? { ...entry, resumedAt: new Date().toISOString(), autoResumed: true }
          : entry
      );

      await prisma.userSubscription.update({
        where: { id: sub.id },
        data: {
          status: 'active',
          pausedAt: null,
          pauseEndsAt: null,
          pauseReason: null,
          pauseHistory: newHistory as unknown as object,
        },
      });
    }

    if (due.length > 0) {
      logger.info('Auto-resumed subscriptions', { count: due.length });
    }

    return due.length;
  },

  /**
   * Kullanıcının duraklatılmış aboneliği var mı?
   */
  async isPaused(userId: string): Promise<boolean> {
    const sub = await prisma.userSubscription.findFirst({
      where: { userId, status: 'paused' },
      select: { id: true },
    });
    return Boolean(sub);
  },

  /**
   * Kullanıcının aktif abonelik kaydını getirir (pause dahil).
   */
  async getActiveSubscription(userId: string) {
    return prisma.userSubscription.findFirst({
      where: { userId, status: { in: ['active', 'paused'] } },
      orderBy: { createdAt: 'desc' },
    });
  },
};
