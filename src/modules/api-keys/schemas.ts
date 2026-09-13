/**
 * API Key Module — Zod Schemas (TR yardımcı API odaklı).
 */

import { z } from 'zod';

export const ApiKeyScopeSchema = z.enum([
  'tr:validate:write',
  'tr:invoice:write',
  'read:profile',
  'write:profile',
  // Legacy (eski anahtarlar)
  'read:monitor',
  'write:monitor',
  'delete:monitor',
  'ai:describe:read',
  'ai:describe:write',
  'ai:bulk:write',
  'ai:brand-voice:write',
  'admin',
]);

export const ApiKeyScopeListSchema = z.array(ApiKeyScopeSchema).min(1, 'En az 1 izin seçilmeli');

export const CreateApiKeySchema = z.object({
  name: z.string().min(1, 'İsim zorunlu').max(100, 'İsim en fazla 100 karakter'),
  scopes: ApiKeyScopeListSchema.default(['tr:validate:write']),
  rateLimit: z.number().int().min(1, 'En az 1 istek/dk').max(10000, 'En fazla 10000 istek/dk').default(60),
  monthlyQuota: z.number().int().min(1, 'En az 1').optional().nullable(),
  expiresAt: z.coerce.date().optional().nullable(),
});

export const UpdateApiKeySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  scopes: ApiKeyScopeListSchema.optional(),
  rateLimit: z.number().int().min(1).max(10000).optional(),
  monthlyQuota: z.number().int().min(1).nullable().optional(),
  expiresAt: z.coerce.date().nullable().optional(),
});

export const RevokeApiKeySchema = z.object({
  reason: z.string().max(500).optional(),
});

export type ApiKeyScope = z.infer<typeof ApiKeyScopeSchema>;
export type CreateApiKeyInput = z.infer<typeof CreateApiKeySchema>;
export type UpdateApiKeyInput = z.infer<typeof UpdateApiKeySchema>;
export type RevokeApiKeyInput = z.infer<typeof RevokeApiKeySchema>;
