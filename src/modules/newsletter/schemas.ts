/**
 * Newsletter Module — Zod Schemas
 *
 * Subscribe, verify ve unsubscribe input validation.
 */

import { z } from 'zod';

export const SubscribeSchema = z.object({
  email: z.string().email('Geçerli bir e-posta adresi girin').max(200),
  name: z.string().min(1).max(100).optional(),
  categories: z.array(z.string().min(1).max(50)).max(20).optional(),
  source: z.string().max(50).optional(),
});

export type SubscribeInput = z.infer<typeof SubscribeSchema>;

export const VerifySchema = z.object({
  token: z.string().min(10, 'Geçersiz doğrulama token'),
});

export const UnsubscribeSchema = z.object({
  token: z.string().min(10, 'Geçersiz abonelik iptal token'),
});

export const BroadcastSchema = z.object({
  subject: z.string().min(1).max(200),
  html: z.string().min(1).max(50_000),
  text: z.string().max(50_000).optional(),
});

export type BroadcastInput = z.infer<typeof BroadcastSchema>;