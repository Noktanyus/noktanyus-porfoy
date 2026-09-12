// src/lib/env.ts
import 'dotenv/config';
import { z } from 'zod';
import { DEFAULT_BASE_URL } from './seo';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, { message: "Database URL is required" }),
  NEXTAUTH_URL: z.string().min(1, { message: "NextAuth URL is required" }),
  NEXTAUTH_SECRET: z.string().min(1, { message: "NextAuth secret is required" }),
  ADMIN_EMAIL: z.string().email(),
  ADMIN_PASSWORD: z.string().min(1),
  // TURNSTILE_SECRET_KEY kaldırıldı
  EMAIL_SERVER: z.string().min(1),
  EMAIL_PORT: z.string().min(1),
  EMAIL_USER: z.string().min(1),
  EMAIL_PASSWORD: z.string().min(1),
  EMAIL_FROM: z.string().email().optional(),
  EMAIL_FROM_NAME: z.string().optional(),
  CLOUDFLARE_TURNSTILE_SECRET_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_BASE_URL: z.string().min(1),
  NEXT_PUBLIC_YANDEX_METRICA_ID: z.string().optional(),
  CRON_SECRET: z.string().optional(),

  // Web Push (VAPID) — opsiyonel; yoksa push endpoint'leri no-op olur
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
  VAPID_SUBJECT: z.string().optional(),

  // AI Provider (OpenAI-compatible) — opsiyonel; 3 env boşsa mock mode
  AI_BASE_URL: z.string().optional(),
  AI_API_KEY: z.string().optional(),
  AI_MODEL: z.string().optional(),
  AI_PROVIDER_DISPLAY_NAME: z.string().optional(),

  // SAML SSO — opsiyonel (L5: SAML SSO production implementation).
  // SAML_IDP_METADATA_URL verilmisse cert/SSO/entityId otomatik cekilir;
  // alternatif olarak SAML_IDP_CERT + SAML_IDP_SSO_URL + SAML_IDP_ENTITY_ID env'den okunur.
  SAML_SP_ENTITY_ID: z.string().optional(),
  SAML_SP_ACS_URL: z.string().url().optional(),
  SAML_SP_PRIVATE_KEY: z.string().optional(),
  SAML_SP_PUBLIC_CERT: z.string().optional(),
  SAML_IDP_METADATA_URL: z.string().url().optional(),
  SAML_IDP_CERT: z.string().optional(),
  SAML_IDP_SSO_URL: z.string().url().optional(),
  SAML_IDP_ENTITY_ID: z.string().optional(),
  SAML_CLOCK_SKEW_MS: z.string().optional(),
  SAML_WANT_ASSERTIONS_SIGNED: z.string().optional(),
  SAML_WANT_RESPONSE_SIGNED: z.string().optional(),
});

const isTestOrSkip =
  process.env.NODE_ENV === 'test' ||
  !!process.env.VITEST ||
  process.env.SKIP_ENV_VALIDATION === 'true' ||
  process.env.SKIP_ENV_VALIDATION === '1';

let parsedEnv: z.infer<typeof envSchema>;

try {
  parsedEnv = envSchema.parse(process.env);
} catch (error) {
  if (isTestOrSkip) {
    parsedEnv = {
      DATABASE_URL: process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/testdb',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || 'dummy-secret-key-at-least-32-chars-long',
      ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@example.com',
      ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'admin123',
      EMAIL_SERVER: process.env.EMAIL_SERVER || 'smtp.example.com',
      EMAIL_PORT: process.env.EMAIL_PORT || '587',
      EMAIL_USER: process.env.EMAIL_USER || 'test@example.com',
      EMAIL_PASSWORD: process.env.EMAIL_PASSWORD || 'testpassword',
      NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
      EMAIL_FROM: process.env.EMAIL_FROM,
      EMAIL_FROM_NAME: process.env.EMAIL_FROM_NAME,
      CLOUDFLARE_TURNSTILE_SECRET_KEY: process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY,
      NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY,
      NEXT_PUBLIC_YANDEX_METRICA_ID: process.env.NEXT_PUBLIC_YANDEX_METRICA_ID,
      CRON_SECRET: process.env.CRON_SECRET,
      NEXT_PUBLIC_VAPID_PUBLIC_KEY: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY,
      VAPID_SUBJECT: process.env.VAPID_SUBJECT,
      AI_BASE_URL: process.env.AI_BASE_URL,
      AI_API_KEY: process.env.AI_API_KEY,
      AI_MODEL: process.env.AI_MODEL,
      AI_PROVIDER_DISPLAY_NAME: process.env.AI_PROVIDER_DISPLAY_NAME,
      SAML_SP_ENTITY_ID: process.env.SAML_SP_ENTITY_ID,
      SAML_SP_ACS_URL: process.env.SAML_SP_ACS_URL,
      SAML_SP_PRIVATE_KEY: process.env.SAML_SP_PRIVATE_KEY,
      SAML_SP_PUBLIC_CERT: process.env.SAML_SP_PUBLIC_CERT,
      SAML_IDP_METADATA_URL: process.env.SAML_IDP_METADATA_URL,
      SAML_IDP_CERT: process.env.SAML_IDP_CERT,
      SAML_IDP_SSO_URL: process.env.SAML_IDP_SSO_URL,
      SAML_IDP_ENTITY_ID: process.env.SAML_IDP_ENTITY_ID,
      SAML_CLOCK_SKEW_MS: process.env.SAML_CLOCK_SKEW_MS,
      SAML_WANT_ASSERTIONS_SIGNED: process.env.SAML_WANT_ASSERTIONS_SIGNED,
      SAML_WANT_RESPONSE_SIGNED: process.env.SAML_WANT_RESPONSE_SIGNED,
    };
  } else if (error instanceof z.ZodError) {
    const missingVariables = error.issues.map(issue => issue.path[0]).join(', ');
    console.error(`Missing or invalid environment variables: ${missingVariables}`);
    process.exit(1);
  } else {
    throw error;
  }
}

export const env = parsedEnv;

/**
 * Uygulamanın genel base URL'si (server-side, callback/redirect üretmek için).
 * Öncelik: NEXTAUTH_URL → NEXT_PUBLIC_BASE_URL → DEFAULT_BASE_URL.
 * Trailing slash otomatik olarak sıyrılır.
 */
export function getAppUrl(): string {
  const raw =
    env.NEXTAUTH_URL ||
    env.NEXT_PUBLIC_BASE_URL ||
    DEFAULT_BASE_URL;
  return raw.replace(/\/+$/, '');
}

/**
 * Public (browser) tarafında kullanılan absolute URL üretmek için.
 * NEXT_PUBLIC_BASE_URL'e düşer; yoksa DEFAULT_BASE_URL döner.
 */
export function getPublicAppUrl(): string {
  return (env.NEXT_PUBLIC_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, '');
}
