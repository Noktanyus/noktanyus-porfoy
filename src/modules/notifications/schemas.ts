/**
 * Notification Module — Schemas
 *
 * Zod validation schemas for notification inputs.
 */

import { z } from 'zod';

export const CreateNotificationSchema = z.object({
  type: z.string().min(1).max(50),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
  link: z.string().url().optional(),
  icon: z.string().max(50).optional(),
  relatedType: z.string().max(50).optional(),
  relatedId: z.string().optional(),
});

export type CreateNotificationInput = z.infer<typeof CreateNotificationSchema>;
