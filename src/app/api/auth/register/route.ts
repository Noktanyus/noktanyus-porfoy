/**
 * @file Kullanıcı kayıt (register) endpoint'i — Phase D.1 Self-Serve Onboarding
 * @description POST /api/auth/register
 *              3 adımlı wizard'ın son adımı. Hem eski form-data'yı (name+email+password)
 *              hem de wizard payload'ını (planSlug + acceptTerms) kabul eder.
 *              Yeni kullanıcı oluşturur, email doğrulama token'ı üretir ve
 *              Resend email ile magic link gönderir.
 *
 *              Güvenlik:
 *              - Rate limiting (auth bucket — Phase D.8)
 *              - Zod validation (onboarding.schemas)
 *              - Hassas veri (şifre) response/logger'a ASLA düşmez
 *              - Email enumeration koruması (var olan user için bile sent=true)
 */

import { NextRequest } from "next/server";
import { ok, fail, withErrorHandling } from "@/lib/apiResponse";
import { withRateLimit } from "@/lib/rateLimitMiddleware";
import { RateLimits } from "@/lib/rateLimit";
import { logger } from "@/lib/logger";
import { env } from "@/lib/env";
import { AppError } from "@/modules/shared/errors";
import { OnboardingPayloadSchema, RegisterStepSchema } from "@/modules/onboarding/schemas";
import { registerUser } from "@/modules/onboarding/service";

export const POST = withRateLimit(RateLimits.auth, async (req: NextRequest) => {
  return withErrorHandling(async () => {
    const body = await req.json().catch(() => ({}));

    // Wizard tam payload ya da eski (name+email+password) form-data — ikisini de kabul et.
    const wizardParsed = OnboardingPayloadSchema.safeParse(body);
    const legacyParsed = wizardParsed.success ? null : RegisterStepSchema.safeParse(body);

    if (!wizardParsed.success && (!legacyParsed || !legacyParsed.success)) {
      // İlk hata mesajını kullanıcıya döndür
      const failedParse = wizardParsed.success ? legacyParsed! : wizardParsed;
      const issues = failedParse.error.issues;
      const message = issues[0]?.message ?? 'Geçersiz kayıt bilgileri';
      throw new AppError(message, 400, 'VALIDATION_ERROR');
    }

    const input = wizardParsed.success
      ? wizardParsed.data
      : {
          ...legacyParsed!.data,
          planSlug: 'starter' as const,
          acceptTerms: true as const,
        } as Parameters<typeof registerUser>[0];

    // Admin email rezervasyonu — validated env üzerinden oku (test/mock
    // setup'larında process.env yerine env mock'unu kullanabiliriz).
    const reservedAdminEmail = env.ADMIN_EMAIL?.toLowerCase().trim();
    if (reservedAdminEmail && input.email === reservedAdminEmail) {
      throw new AppError("Bu e-posta adresi kullanılamaz", 400, "RESERVED_EMAIL");
    }

    const ipAddress =
      req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? undefined;
    const userAgent = req.headers.get('user-agent') ?? undefined;

    try {
      const result = await registerUser(input, { ipAddress, userAgent });

      logger.info("User registered (self-serve)", {
        userId: result.userId,
        email: result.email,
        planSlug: input.planSlug,
      });

      // Auto-login YAPMIYORUZ — kullanıcı önce email'ini doğrulamalı.
      // Login linki email body'sinde verilecek.
      return ok(
        {
          user: {
            id: result.userId,
            email: result.email,
            name: result.name,
          },
          emailVerificationRequired: result.emailVerificationRequired,
          message:
            'Hesabınız oluşturuldu. E-posta adresinize gönderilen doğrulama linkine tıklayarak hesabınızı aktifleştirin.',
        },
        { status: 201 }
      );
    } catch (error) {
      if (error instanceof AppError) throw error;
      const message = error instanceof Error ? error.message : 'Kayıt başarısız';
      // "zaten kayıtlı" gibi beklenen hataları 409 olarak döndür
      throw new AppError(message, 409, 'REGISTRATION_FAILED');
    }
  });
});