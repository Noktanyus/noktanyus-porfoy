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
});

try {
  envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    const missingVariables = error.issues.map(issue => issue.path[0]).join(', ');
    console.error(`Missing or invalid environment variables: ${missingVariables}`);
    process.exit(1);
  }
}

export const env = envSchema.parse(process.env);
