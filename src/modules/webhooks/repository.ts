/**
 * Webhooks Module — Repository Layer
 *
 * Webhook ve WebhookDelivery için CRUD operasyonları + özel sorgular.
 * BaseRepository pattern'i üzerine kurulu.
 */

import crypto from 'crypto';
import { BaseRepository } from '../shared/repository';
import { prisma } from '@/lib/prisma';
import type { Webhook, WebhookDelivery } from '@prisma/client';

export class WebhookRepository extends BaseRepository<Webhook> {
  protected get model() {
    return this.prisma.webhook;
  }

  async findByUserId(userId: string) {
    return this.prisma.webhook.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { deliveries: true } } },
    });
  }

  async findActiveForEvent(event: string) {
    const webhooks = await this.prisma.webhook.findMany({ where: { active: true } });
    return webhooks.filter(
      (w) => Array.isArray(w.events) && (w.events as string[]).includes(event)
    );
  }

  async generateSecret(): Promise<string> {
    return crypto.randomBytes(32).toString('hex');
  }

  async incrementDelivery(webhookId: string) {
    return this.prisma.webhook.update({
      where: { id: webhookId },
      data: {
        totalDeliveries: { increment: 1 },
        lastDeliveryAt: new Date(),
      },
    });
  }

  async incrementFailure(webhookId: string) {
    return this.prisma.webhook.update({
      where: { id: webhookId },
      data: { failedDeliveries: { increment: 1 } },
    });
  }
}

export class WebhookDeliveryRepository extends BaseRepository<WebhookDelivery> {
  protected get model() {
    return this.prisma.webhookDelivery;
  }

  async findPendingForRetry() {
    return this.prisma.webhookDelivery.findMany({
      where: {
        status: 'RETRYING',
        nextRetryAt: { lte: new Date() },
      },
      include: { webhook: true },
      take: 50,
    });
  }

  async findDeadLetter(userId?: string, limit = 100) {
    return this.prisma.webhookDelivery.findMany({
      where: {
        status: 'DEAD_LETTER',
        ...(userId ? { webhook: { userId } } : {}),
      },
      include: { webhook: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async findByWebhookId(webhookId: string, limit = 50) {
    return this.prisma.webhookDelivery.findMany({
      where: { webhookId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}

export const webhookRepository = new WebhookRepository();
export const webhookDeliveryRepository = new WebhookDeliveryRepository();
