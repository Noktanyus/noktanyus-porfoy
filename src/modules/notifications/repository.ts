/**
 * Notification Module — Repository Layer
 *
 * Prisma-backed repository for Notification model.
 */

import { prisma } from '@/lib/prisma';
import { BaseRepository } from '../shared/repository';
import type { Notification } from '@prisma/client';

export class NotificationRepository extends BaseRepository<Notification> {
  protected get model() {
    return this.prisma.notification;
  }

  async findByUserId(
    userId: string,
    opts: { limit?: number; unreadOnly?: boolean } = {}
  ): Promise<Notification[]> {
    return this.prisma.notification.findMany({
      where: {
        userId,
        ...(opts.unreadOnly ? { read: false } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: opts.limit ?? 50,
    });
  }

  async countUnread(userId: string): Promise<number> {
    return this.prisma.notification.count({ where: { userId, read: false } });
  }

  async markRead(userId: string, ids: string[]): Promise<{ count: number }> {
    return this.prisma.notification.updateMany({
      where: { userId, id: { in: ids } },
      data: { read: true, readAt: new Date() },
    });
  }

  async markAllRead(userId: string): Promise<{ count: number }> {
    return this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true, readAt: new Date() },
    });
  }
}

export const notificationRepository = new NotificationRepository();
