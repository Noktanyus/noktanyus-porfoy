/**
 * API Key Module — Zod Schemas
 *
 * API anahtarları için input validation şemaları.
 * Generate / revoke / update / scope yönetimi için.
 */

import { z } from 'zod';
import { SAAS_SCOPE_NAMES } from '@/lib/saasScopes';

// --- Scopes ---
// Legacy scope'lar (geriye uyumluluk) + saasScope kataloğu (SaaS API rotaları).
// `admin` shortcut tüm scope'ları kapsadığı için ayrıca listelenmiştir.
export const ApiKeyScopeSchema = z.enum([
  // Legacy monitoring / profile scopes — geriye uyumluluk
  'read:monitor',
  'write:monitor',
  'delete:monitor',
  'read:profile',
  'write:profile',
  // SaaS scope'ları — saasScopes.ts SAAS_SCOPES ile senkronize
  ...SAAS_SCOPE_NAMES,
  // Admin shortcut — tüm scope'ları kapsar
  'admin',
]);

export const ApiKeyScopeListSchema = z.array(ApiKeyScopeSchema).min(1, 'En az 1 izin seçilmeli');

// --- Create ---
export const CreateApiKeySchema = z.object({
  name: z.string().min(1, 'İsim zorunlu').max(100, 'İsim en fazla 100 karakter'),
  scopes: ApiKeyScopeListSchema.default(['read:monitor']),
  rateLimit: z.number().int().min(1, 'En az 1 istek/dk').max(10000, 'En fazla 10000 istek/dk').default(60),
  monthlyQuota: z.number().int().min(1, 'En az 1').optional().nullable(),
  expiresAt: z.coerce.date().optional().nullable(),
});

// --- Update ---
export const UpdateApiKeySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  scopes: ApiKeyScopeListSchema.optional(),
  rateLimit: z.number().int().min(1).max(10000).optional(),
  monthlyQuota: z.number().int().min(1).nullable().optional(),
  expiresAt: z.coerce.date().nullable().optional(),
});

// --- Revoke ---
export const RevokeApiKeySchema = z.object({
  reason: z.string().max(500).optional(),
});

// --- Type exports ---
export type ApiKeyScope = z.infer<typeof ApiKeyScopeSchema>;
export type CreateApiKeyInput = z.infer<typeof CreateApiKeySchema>;
export type UpdateApiKeyInput = z.infer<typeof UpdateApiKeySchema>;
export type RevokeApiKeyInput = z.infer<typeof RevokeApiKeySchema>;