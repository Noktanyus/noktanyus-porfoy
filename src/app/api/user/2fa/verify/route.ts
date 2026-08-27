/**
 * POST /api/user/2fa/verify — /setup sonrasi kullanilan 6 haneli TOTP
 * token'i dogrular ve 2FA'yi AKTIVE eder.
 *
 * Body: { token: string (6 hane) }
 *
 * - Token dogrulanamazsa 401 doner (state degismez).
 * - Basarili ise twoFactorEnabled=true + twoFactorVerifiedAt=now() yazilir.
 * - Audit log kaydi olusturulur (action: SETTINGS_UPDATE).
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, fail, withErrorHandling } from "@/lib/apiResponse";
import { twoFactor } from "@/lib/twoFactor";
import { logger } from "@/lib/logger";
import { logAudit } from "@/lib/audit";

const VerifySchema = z.object({
  token: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Token 6 haneli rakam olmalı"),
});

export async function POST(req: NextRequest) {
  return withErrorHandling<unknown>(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return fail({
        code: "UNAUTHORIZED",
        message: "Giriş gerekli",
        statusCode: 401,
      } as any);
    }
    const userId = (session.user as any).id as string | undefined;
    if (!userId) {
      return fail({
        code: "UNAUTHORIZED",
        message: "Geçersiz oturum",
        statusCode: 401,
      } as any);
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return fail({
        code: "VALIDATION_ERROR",
        message: "Geçersiz JSON gövdesi",
        statusCode: 400,
      } as any);
    }

    const { token } = VerifySchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, twoFactorSecret: true, twoFactorEnabled: true },
    });
    if (!user) {
      return fail({
        code: "NOT_FOUND",
        message: "Kullanıcı bulunamadı",
        statusCode: 404,
      } as any);
    }

    if (user.twoFactorEnabled) {
      return fail({
        code: "ALREADY_ENABLED",
        message: "2FA zaten aktif",
        statusCode: 400,
      } as any);
    }

    if (!user.twoFactorSecret) {
      return fail({
        code: "NOT_SETUP",
        message: "Önce /api/user/2fa/setup çağırın",
        statusCode: 400,
      } as any);
    }

    const isValid = twoFactor.verifyToken(token, user.twoFactorSecret);
    if (!isValid) {
      logger.warn("2FA verify failed (invalid token)", { userId });
      return fail({
        code: "INVALID_TOKEN",
        message: "Geçersiz doğrulama kodu",
        statusCode: 401,
      } as any);
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: true,
        twoFactorVerifiedAt: new Date(),
      },
    });

    await logAudit({
      userId,
      userEmail: user.email,
      action: "SETTINGS_UPDATE",
      resource: "user_2fa",
      resourceId: userId,
      details: { event: "2fa_enabled" },
    });

    logger.info("2FA enabled", { userId });
    return ok({ enabled: true });
  });
}
