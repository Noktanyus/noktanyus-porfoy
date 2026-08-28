/**
 * Push Notifications Module — Repository
 *
 * PushSubscription modeli icin Prisma-backed veri erisim katmani.
 */

import { prisma } from '@/lib/prisma';
import type { PushSubscription } from '@prisma/client';

export const pushRepository = {
  async upsert(input: {
    userId: string;
    endpoint: string;
    p256dh: string;
    auth: string;
  }): Promise<PushSubscription> {
    return prisma.pushSubscription.upsert({
      where: { endpoint: input.endpoint },
      create: {
        userId: input.userId,
        endpoint: input.endpoint,
        p256dh: input.p256dh,
        auth: input.auth,
        active: true,
      },
      update: {
        userId: input.userId,
        p256dh: input.p256dh,
        auth: input.auth,
        active: true,
      },
    });
  },

  async findByEndpoint(endpoint: string): Promise<PushSubscription | null> {
    return prisma.pushSubscription.findUnique({ where: { endpoint } });
  },

  async findActiveByUser(userId: string): Promise<PushSubscription[]> {
    return prisma.pushSubscription.findMany({
      where: { userId, active: true },
    });
  },

  async findAllActive(): Promise<PushSubscription[]> {
    return prisma.pushSubscription.findMany({ where: { active: true } });
  },

  async deactivate(endpoint: string): Promise<{ count: number }> {
    return prisma.pushSubscription.updateMany({
      where: { endpoint, active: true },
      data: { active: false },
    });
  },

  async count(userId?: string): Promise<number> {
    return prisma.pushSubscription.count({
      where: userId ? { userId, active: true } : { active: true },
    });
  },
};