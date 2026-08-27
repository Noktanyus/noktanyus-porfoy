/**
 * Notification Module — Service Layer
 *
 * In-app notification business logic (create, list, mark as read).
 * UI'ın SSE/poll ihtiyaçlarını karşılar.
 */

import { notificationRepository } from './repository';
import { CreateNotificationInput } from './schemas';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

export const notificationService = {
  async create(userId: string, input: CreateNotificationInput) {
    return notificationRepository.create({ userId, ...input });
  },

  async createBulk(userId: string, inputs: CreateNotificationInput[]) {
    if (inputs.length === 0) return { count: 0 };
    return prisma.notification.createMany({
      data: inputs.map((i) => ({ userId, ...i })),
    });
  },

  async list(userId: string, limit = 50) {
    return notificationRepository.findByUserId(userId, { limit });
  },

  async unreadCount(userId: string) {
    return notificationRepository.countUnread(userId);
  },

  async markRead(userId: string, ids: string[]) {
    if (!ids.length) return { count: 0 };
    return notificationRepository.markRead(userId, ids);
  },

  async markAllRead(userId: string) {
    return notificationRepository.markAllRead(userId);
  },

  /**
   * Kolaylık dispatch metodu. Event türüne göre bildirim üretir.
   * commerceService ve monitoringService tarafından çağrılır.
   */
  async dispatch(
    userId: string | null | undefined,
    type: string,
    data: {
      title: string;
      message: string;
      link?: string;
      icon?: string;
      relatedType?: string;
      relatedId?: string;
    }
  ) {
    if (!userId) {
      logger.debug('Notification dispatch skipped: no userId', { type });
      return null;
    }
    try {
      return await this.create(userId, { type, ...data });
    } catch (err) {
      logger.warn('Notification dispatch failed', { userId, type, error: err });
      return null;
    }
  },
};
