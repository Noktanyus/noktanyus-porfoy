/**
 * Webhooks Module — Service Layer
 *
 * Webhook yaşam döngüsü, HMAC imzalı teslimat, exponential backoff retry
 * ve dead letter queue yönetimi.
 */

import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { NotFoundError } from '@/modules/shared/errors';
import { webhookRepository, webhookDeliveryRepository } from './repository';
import type { CreateWebhookInput, UpdateWebhookInput } from './schemas';

const SIGNATURE_HEADER = 'X-Webhook-Signature';
const EVENT_HEADER = 'X-Webhook-Event';
const DELIVERY_HEADER = 'X-Webhook-Delivery-Id';
const USER_AGENT = 'Noktanyus-Webhooks/1.0';
const REQUEST_TIMEOUT_MS = 30_000;
const MAX_ATTEMPTS = 5;
// Exponential backoff cap: 2^attempt seconds, max 300s (5 min).
const BACKOFF_MAX_SECONDS = 300;

function generateSignature(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

/**
 * Exponential backoff: 2^attempt seconds (capped).
 * attempt 1 → 2s, 2 → 4s, 3 → 8s, 4 → 16s, 5 → 32s ... (max 300s)
 */
function backoffDelay(attempts: number): number {
  return Math.min(BACKOFF_MAX_SECONDS, Math.pow(2, attempts));
}

export const webhookService = {
  // --- CRUD ---

  async listWebhooks(userId: string) {
    return webhookRepository.findByUserId(userId);
  },

  async getWebhook(userId: string, id: string) {
    const webhook = await webhookRepository.findById(id);
    if (!webhook || webhook.userId !== userId) throw new NotFoundError('Webhook');
    return webhook;
  },

  async createWebhook(userId: string, input: CreateWebhookInput) {
    const secret = await webhookRepository.generateSecret();
    return webhookRepository.create({
      user: { connect: { id: userId } },
      url: input.url,
      description: input.description ?? null,
      events: input.events,
      secret,
    } as any);
  },

  async updateWebhook(userId: string, id: string, input: UpdateWebhookInput) {
    await this.getWebhook(userId, id);
    return webhookRepository.update(id, {
      ...(input.url !== undefined ? { url: input.url } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.events !== undefined ? { events: input.events } : {}),
      ...(input.active !== undefined ? { active: input.active } : {}),
    } as any);
  },

  async deleteWebhook(userId: string, id: string) {
    await this.getWebhook(userId, id);
    return webhookRepository.delete(id);
  },

  async rotateSecret(userId: string, id: string) {
    await this.getWebhook(userId, id);
    const newSecret = await webhookRepository.generateSecret();
    return webhookRepository.update(id, { secret: newSecret } as any);
  },

  async getDeliveries(userId: string, webhookId: string) {
    await this.getWebhook(userId, webhookId);
    return webhookDeliveryRepository.findByWebhookId(webhookId);
  },

  async getDeadLetter(userId: string) {
    return webhookDeliveryRepository.findDeadLetter(userId);
  },

  // --- Event Dispatch ---

  /**
   * Tüm aktif webhook'lara olayı dispatch et (event listesinde olan).
   * Her webhook için ayrı bir delivery kaydı oluşturulur.
   */
  async dispatchEvent(event: string, payload: unknown) {
    const webhooks = await webhookRepository.findActiveForEvent(event);
    for (const webhook of webhooks) {
      try {
        await this.deliverWebhook(webhook.id, event, payload);
      } catch (err) {
        logger.error('Webhook dispatch failed', {
          webhookId: webhook.id,
          event,
          error: err,
        });
      }
    }
    return webhooks.length;
  },

  /**
   * Tek bir webhook'a delivery yap. Retry mekanizması içerir.
   */
  async deliverWebhook(webhookId: string, event: string, payload: unknown) {
    const webhook = await webhookRepository.findById(webhookId);
    if (!webhook || !webhook.active) return;

    const body = JSON.stringify({
      event,
      timestamp: new Date().toISOString(),
      data: payload,
    });
    const signature = generateSignature(body, webhook.secret);

    const delivery = await webhookDeliveryRepository.create({
      webhookId: webhook.id,
      event,
      payload: payload as any,
      status: 'PENDING',
      attempts: 0,
      maxAttempts: MAX_ATTEMPTS,
    } as any);

    try {
      const res = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          [SIGNATURE_HEADER]: `sha256=${signature}`,
          [EVENT_HEADER]: event,
          [DELIVERY_HEADER]: delivery.id,
          'User-Agent': USER_AGENT,
        },
        body,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });

      if (res.ok) {
        const responseBody = (await res.text()).substring(0, 1000);
        await webhookDeliveryRepository.update(delivery.id, {
          status: 'SUCCESS',
          attempts: 1,
          responseStatus: res.status,
          responseBody,
          deliveredAt: new Date(),
          errorMessage: null,
        });
        await webhookRepository.incrementDelivery(webhook.id);
        return;
      }

      await this.scheduleRetry(
        delivery.id,
        webhook.id,
        `HTTP ${res.status}`,
        res.status,
        (await res.text()).substring(0, 1000)
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      await this.scheduleRetry(delivery.id, webhook.id, errorMessage);
    }
  },

  /**
   * Başarısız delivery için retry planla. Exponential backoff uygulanır.
   * Maksimum deneme sayısına ulaşıldığında DEAD_LETTER'a taşınır.
   */
  async scheduleRetry(
    deliveryId: string,
    webhookId: string,
    errorMessage: string,
    responseStatus?: number,
    responseBody?: string
  ) {
    const delivery = await webhookDeliveryRepository.findById(deliveryId);
    if (!delivery) return;

    const newAttempts = delivery.attempts + 1;

    if (newAttempts >= delivery.maxAttempts) {
      await webhookDeliveryRepository.update(deliveryId, {
        status: 'DEAD_LETTER',
        attempts: newAttempts,
        errorMessage,
        ...(responseStatus !== undefined ? { responseStatus } : {}),
        ...(responseBody !== undefined ? { responseBody } : {}),
      });
      await webhookRepository.incrementFailure(webhookId);
      logger.warn('Webhook delivery moved to dead letter queue', {
        deliveryId,
        webhookId,
        attempts: newAttempts,
        errorMessage,
      });
      return;
    }

    const nextRetryAt = new Date(Date.now() + backoffDelay(newAttempts) * 1000);
    await webhookDeliveryRepository.update(deliveryId, {
      status: 'RETRYING',
      attempts: newAttempts,
      nextRetryAt,
      errorMessage,
      ...(responseStatus !== undefined ? { responseStatus } : {}),
      ...(responseBody !== undefined ? { responseBody } : {}),
    });
  },

  /**
   * Retry kuyruğundaki delivery'leri işle. Cron job tarafından çağrılır.
   * Aktif olmayan webhook'ların delivery'leri atlanır.
   */
  async processRetries() {
    const deliveries = await webhookDeliveryRepository.findPendingForRetry();
    let processed = 0;

    for (const delivery of deliveries) {
      if (!delivery.webhook.active) {
        // Webhook pasifse DLQ'ya gönder (zombie retry önleme)
        await webhookDeliveryRepository.update(delivery.id, {
          status: 'DEAD_LETTER',
          errorMessage: 'Webhook pasif - retry iptal',
        });
        continue;
      }
      try {
        await this.deliverWebhook(delivery.webhookId, delivery.event, delivery.payload);
        processed += 1;
      } catch (err) {
        logger.error('Retry processing failed', {
          deliveryId: delivery.id,
          error: err,
        });
      }
    }

    return { total: deliveries.length, processed };
  },

  /**
   * Verilen payload + secret'tan imza üret (public utility).
   * Client-side doğrulama için kullanılabilir.
   */
  generateSignature,
};
