// src/lib/env.ts
import 'dotenv/config';
import { z } from 'zod';

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
});

const isSkipValidation = process.env.SKIP_ENV_VALIDATION === 'true' || process.env.SKIP_ENV_VALIDATION === '1';

let parsedEnv: z.infer<typeof envSchema>;

try {
  parsedEnv = envSchema.parse(process.env);
} catch (error) {
  if (isSkipValidation) {
    console.warn('⚠️ SKIP_ENV_VALIDATION is active, using fallback environment values.');
    parsedEnv = {
      DATABASE_URL: process.env.DATABASE_URL || 'postgresql://dummy:dummy@localhost:5432/dummy',
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
