/**
 * Video Calls Module — Zod Schemas
 *
 * Phase "Video Calls + Affiliate" kapsaminda eklendi.
 * WebRTC video call odalari icin input validation.
 */

import { z } from 'zod';

export const CreateVideoCallSchema = z.object({
  title: z.string().trim().min(3, 'Başlık en az 3 karakter').max(200, 'Başlık en fazla 200 karakter'),
  description: z.string().trim().max(1000, 'Açıklama en fazla 1000 karakter').optional(),
  scheduledAt: z.coerce.date().optional(),
  durationMin: z.number().int().min(15, 'Süre en az 15 dakika').max(480, 'Süre en fazla 480 dakika').default(60),
  maxParticipants: z.number().int().min(2, 'En az 2 katılımcı').max(50, 'En fazla 50 katılımcı').default(10),
  productId: z.string().optional(),
  orderId: z.string().optional(),
});

export const JoinVideoCallSchema = z.object({
  name: z.string().trim().min(1, 'İsim gerekli').max(100, 'İsim en fazla 100 karakter'),
  email: z.string().email('Geçerli bir email adresi').optional(),
});

export type CreateVideoCallInput = z.infer<typeof CreateVideoCallSchema>;
export type JoinVideoCallInput = z.infer<typeof JoinVideoCallSchema>;