import { z } from "zod";

/**
 * .env dosyasında tanımlanması gereken ortam değişkenlerinin şeması.
 * Bu, projenin başlangıcında tüm gerekli değişkenlerin mevcut ve doğru formatta
 * olduğundan emin olmamızı sağlar.
 */
const envSchema = z.object({
  // NextAuth
  NEXTAUTH_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(1),

  // Proje URL'si
  NEXT_PUBLIC_BASE_URL: z.string().url(),

  // Admin Giriş Bilgileri
  ADMIN_EMAIL: z.string().email(),
  ADMIN_PASSWORD: z.string().min(1),

  // GitHub Entegrasyonu
  GITHUB_USERNAME: z.string().min(1),
  GITHUB_TOKEN: z.string().min(1),

  // Cloudflare Turnstile
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().min(1),
  TURNSTILE_SECRET_KEY: z.string().min(1),

  // SMTP E-posta Ayarları
  EMAIL_SERVER: z.string().min(1),
  EMAIL_PORT: z.string(),
  EMAIL_USER: z.string().min(1),
  EMAIL_PASSWORD: z.string().min(1),
  EMAIL_FROM: z.string().email(),

  // Yandex Metrica (Opsiyonel)
  NEXT_PUBLIC_YANDEX_METRICA_ID: z.string().optional(),
});

/**
 * Ortam değişkenlerini doğrular ve tip-güvenli bir nesne olarak dışa aktarır.
 * Eğer bir değişken eksik veya yanlış formatta ise, proje başlangıcında hata fırlatır.
 */
export const env = envSchema.parse(process.env);
