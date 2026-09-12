/**
 * @file OAuth 2.0 Module — Zod Schemas
 * @description Public API OAuth 2.0 Authorization Code + PKCE (RFC 6749 + RFC 7636).
 *              Input validation şemaları.
 *
 *              Akış:
 *              1. Client → GET  /api/auth/oauth/authorize (consent UI redirect)
 *              2. User  → POST /api/auth/oauth/authorize/decision (allow/deny)
 *              3. Client → POST /api/auth/oauth/token (code → access_token)
 */

import { z } from 'zod';

// --- OAuth Scopes ---
// Desteklenen scope'lar. Client yalnızca sahip olduğu scope'ları talep edebilir.
export const OAuthScopeSchema = z.enum([
  'read:profile',
  'write:profile',
  'read:monitor',
  'write:monitor',
  'read:orders',
  'read:ai',
  'write:ai',
  'read:webhooks',
  'write:webhooks',
  'admin',
]);
export type OAuthScope = z.infer<typeof OAuthScopeSchema>;

export const OAuthScopeListSchema = z
  .string()
  .min(1)
  .transform((s) => s.trim().split(/\s+/).filter(Boolean))
  .pipe(z.array(OAuthScopeSchema).min(1, 'En az 1 scope gerekli'));

/**
 * Redirect URI validation: mutlak https (prod) veya http://localhost (dev).
 * Wildcard/fragment yasak (RFC 6749 § 3.1.2).
 */
const RedirectUriSchema = z
  .string()
  .url('Geçerli bir URL girin')
  .refine(
    (url) => {
      try {
        const u = new URL(url);
        if (u.protocol === 'https:') return true;
        if (u.protocol === 'http:' && u.hostname === 'localhost') return true;
        return false;
      } catch {
        return false;
      }
    },
    { message: 'Redirect URI yalnızca https:// veya http://localhost olabilir' }
  )
  .refine((url) => !url.includes('#'), { message: 'Redirect URI fragment içeremez' });

/**
 * PKCE code_verifier: RFC 7636 § 4.1
 * 43-128 char, [A-Z a-z 0-9 - . _ ~]
 */
const CodeVerifierSchema = z
  .string()
  .min(43, 'code_verifier en az 43 karakter olmalı')
  .max(128, 'code_verifier en fazla 128 karakter olabilir')
  .regex(/^[A-Za-z0-9\-._~]+$/, 'Geçersiz code_verifier karakterleri');

/**
 * PKCE code_challenge: 43-128 char, base64url.
 */
const CodeChallengeSchema = z
  .string()
  .min(43, 'code_challenge en az 43 karakter olmalı')
  .max(128, 'code_challenge en fazla 128 karakter olabilir')
  .regex(/^[A-Za-z0-9\-_]+$/, 'Geçersiz code_challenge (base64url olmalı)');

const CodeChallengeMethodSchema = z.enum(['S256', 'plain']).default('S256');

// --- /authorize (GET) ---
export const AuthorizeRequestSchema = z.object({
  response_type: z.literal('code', {
    errorMap: () => ({ message: 'response_type yalnızca "code" olabilir' }),
  }),
  client_id: z.string().min(1, 'client_id gerekli'),
  redirect_uri: RedirectUriSchema,
  scope: z
    .string()
    .min(1, 'scope gerekli')
    .default('read:profile'),
  state: z.string().min(1).max(512).optional(),
  code_challenge: CodeChallengeSchema,
  code_challenge_method: CodeChallengeMethodSchema,
});
export type AuthorizeRequest = z.infer<typeof AuthorizeRequestSchema>;

// --- /authorize/decision (POST) ---
export const AuthorizeDecisionSchema = z.object({
  // Client → Server bilgileri (session cookie yerine query de destekle)
  client_id: z.string().min(1),
  redirect_uri: RedirectUriSchema,
  scope: z.string().min(1),
  state: z.string().min(1).max(512).optional(),
  code_challenge: CodeChallengeSchema,
  code_challenge_method: CodeChallengeMethodSchema,
  // Kullanıcı kararı
  decision: z.enum(['allow', 'deny']),
});
export type AuthorizeDecision = z.infer<typeof AuthorizeDecisionSchema>;

// --- /token (POST) ---
// OAuth 2.0 Token Request — RFC 6749 § 4.1.3
// Discriminated union: grant_type'a gore zorunlu alanlar farkli (TypeScript
// narrowing ile rotute katmaninda tip-guvenli dispatch saglanir).
const AuthorizationCodeGrantSchema = z.object({
  grant_type: z.literal('authorization_code'),
  code: z.string().min(1, 'authorization_code grant için code gerekli'),
  redirect_uri: RedirectUriSchema, // zorunlu (RFC 6749 § 4.1.3)
  code_verifier: CodeVerifierSchema, // PKCE zorunlu
  // client_id + client_secret route katmaninda Basic auth veya body'den okunur
  client_id: z.string().optional(),
  client_secret: z.string().optional(),
  scope: z.string().optional(),
});
export type AuthorizationCodeGrant = z.infer<typeof AuthorizationCodeGrantSchema>;

const RefreshTokenGrantSchema = z.object({
  grant_type: z.literal('refresh_token'),
  refresh_token: z.string().min(1, 'refresh_token grant için refresh_token gerekli'),
  // scope opsiyonel ve sadece mevcut scope altkumesi olabilir (RFC 6749 § 6)
  scope: z.string().optional(),
  client_id: z.string().optional(),
  client_secret: z.string().optional(),
});
export type RefreshTokenGrant = z.infer<typeof RefreshTokenGrantSchema>;

export const TokenRequestSchema = z.discriminatedUnion('grant_type', [
  AuthorizationCodeGrantSchema,
  RefreshTokenGrantSchema,
]);
export type TokenRequest = z.infer<typeof TokenRequestSchema>;

// --- /clients (admin) — Client yaratma ---
export const CreateClientSchema = z.object({
  name: z.string().min(1, 'İsim gerekli').max(100, 'İsim en fazla 100 karakter'),
  redirectUris: z
    .array(RedirectUriSchema)
    .min(1, 'En az 1 redirect URI gerekli')
    .max(10, 'En fazla 10 redirect URI'),
  scopes: z.array(OAuthScopeSchema).min(1, 'En az 1 scope seçilmeli'),
});
export type CreateClientInput = z.infer<typeof CreateClientSchema>;
