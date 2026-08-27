/**
 * Webhooks Module — Zod Schemas
 *
 * Kullanıcı tanımlı webhook'lar için input validation şemaları.
 * Desteklenen olay tipleri, oluşturma ve güncelleme validasyonu.
 */

import { z } from 'zod';

// --- Supported Events ---
export const WebhookEventSchema = z.enum([
  'order.created',
  'order.paid',
  'order.refunded',
  'subscription.created',
  'subscription.cancelled',
  'monitor.down',
  'monitor.up',
  'monitor.created',
  'monitor.deleted',
  'user.created',
  'newsletter.subscribed',
]);

export type WebhookEvent = z.infer<typeof WebhookEventSchema>;

// --- Create ---
export const CreateWebhookSchema = z.object({
  url: z.string().url('Geçerli bir URL girin'),
  description: z.string().max(200, 'Açıklama en fazla 200 karakter').optional(),
  events: z.array(WebhookEventSchema).min(1, 'En az 1 olay seçilmeli').max(20, 'En fazla 20 olay'),
});

export type CreateWebhookInput = z.infer<typeof CreateWebhookSchema>;

// --- Update ---
export const UpdateWebhookSchema = z.object({
  url: z.string().url('Geçerli bir URL girin').optional(),
  description: z.string().max(200, 'Açıklama en fazla 200 karakter').optional(),
  events: z.array(WebhookEventSchema).min(1, 'En az 1 olay seçilmeli').max(20).optional(),
  active: z.boolean().optional(),
});

export type UpdateWebhookInput = z.infer<typeof UpdateWebhookSchema>;
