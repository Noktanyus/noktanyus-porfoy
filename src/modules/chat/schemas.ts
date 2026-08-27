/**
 * Chat Module — Zod Schemas
 *
 * In-app destek için input validation.
 */

import { z } from 'zod';

export const CreateConversationSchema = z.object({
  subject: z.string().trim().min(3, 'Konu en az 3 karakter').max(200, 'Konu en fazla 200 karakter'),
  message: z.string().trim().min(1, 'Mesaj boş olamaz').max(5000, 'Mesaj en fazla 5000 karakter'),
});

export const SendMessageSchema = z.object({
  content: z.string().trim().min(1, 'Mesaj boş olamaz').max(5000, 'Mesaj en fazla 5000 karakter'),
  attachments: z
    .array(
      z.object({
        name: z.string().min(1).max(255),
        url: z.string().url(),
        type: z.string().min(1).max(100),
      })
    )
    .optional(),
});

export const MarkReadSchema = z.object({
  conversationId: z.string().min(1),
});

export type CreateConversationInput = z.infer<typeof CreateConversationSchema>;
export type SendMessageInput = z.infer<typeof SendMessageSchema>;
