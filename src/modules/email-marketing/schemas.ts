/**
 * Email Marketing Module — Zod Schemas
 *
 * Campaign + Step olusturma/dogrulama icin Zod semalari.
 */

import { z } from 'zod';

export const CampaignTypeSchema = z.enum(['drip', 'broadcast', 'behavioral']);
export type CampaignTypeInput = z.infer<typeof CampaignTypeSchema>;

export const CreateCampaignSchema = z.object({
  name: z.string().min(3).max(200),
  campaignType: CampaignTypeSchema.default('drip'),
  triggerEvent: z.string().max(100).optional(),
  filterAudience: z.record(z.any()).optional(),
  subject: z.string().min(3).max(200),
  template: z.string().min(10),
  fromName: z.string().max(100).default('Noktanyus'),
  fromEmail: z.string().email().optional(),
  scheduledAt: z.coerce.date().optional(),
});
export type CreateCampaignInput = z.infer<typeof CreateCampaignSchema>;

export const CreateStepSchema = z.object({
  order: z.number().int().min(1),
  subject: z.string().min(3).max(200),
  template: z.string().min(10),
  delayHours: z.number().int().min(0).max(720).default(0),
});
export type CreateStepInput = z.infer<typeof CreateStepSchema>;

export const UpdateEmailPreferenceSchema = z.object({
  marketing: z.boolean().optional(),
  transactional: z.boolean().optional(),
  newsletter: z.boolean().optional(),
});
export type UpdateEmailPreferenceInput = z.infer<typeof UpdateEmailPreferenceSchema>;