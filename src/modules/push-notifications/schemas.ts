/**
 * Push Notifications Module — Zod Schemas
 *
 * Push subscription input validation.
 */

import { z } from 'zod';

/**
 * Tarayicidan gelen PushSubscription JSON yapisi.
 * Service worker uzerinden alinan PushSubscription.toJSON() ciktisi.
 */
export const SubscribePushSchema = z.object({
  endpoint: z.string().url().max(2048),
  keys: z.object({
    p256dh: z.string().min(1).max(512),
    auth: z.string().min(1).max(64),
  }),
});

export type SubscribePushInput = z.infer<typeof SubscribePushSchema>;

/**
 * Unsubscribe icin endpoint bilgisi yeterli (endpoint benzersiz).
 */
export const UnsubscribePushSchema = z.object({
  endpoint: z.string().url().max(2048),
});

export type UnsubscribePushInput = z.infer<typeof UnsubscribePushSchema>;

/**
 * Server tarafinda push gondermek icin payload.
 */
export const PushPayloadSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(1000),
  icon: z.string().url().optional(),
  badge: z.string().url().optional(),
  url: z.string().url().optional(),
  tag: z.string().max(100).optional(),
  data: z.record(z.unknown()).optional(),
});

export type PushPayload = z.infer<typeof PushPayloadSchema>;