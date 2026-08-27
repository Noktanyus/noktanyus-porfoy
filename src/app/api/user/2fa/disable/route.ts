/**
 * POST /api/user/2fa/disable — 2FA'yi devre disi birakir.
 *
 * Body: { password: string } — mevcut sifre (re-authentication)
 *
 * - OAuth-only kullanicilar (password null) icin: sifre yerine mevcut
 *   2FA token'i da kabul edilir (password OR token).
 * - Basarili ise iki alan temizlenir: twoFactorEnabled=false, secret/backupCodes silinir.
 * - Audit log kaydi olusturulur.
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, fail, withErrorHandling } from "@/lib/apiResponse";
import { twoFactor } from "@/lib/twoFactor";
import { logger } from "@/lib/logger";
import { logAudit } from "@/lib/audit";

const BCRYPT_INVALID_HASH =
  "$2a$12$invalidsaltinvalidsaltinvO5gQUxjCz0VOZmC9OgN8HkaaHAXk.";

const DisableSchema = z.object({
  password: z.string().min(1).optional(),
  token: z.string().trim().regex(/^\d{6}$/).optional(),
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

    const { password, token } = DisableSchema.parse(body);
    if (!password && !token) {
      return fail({
        code: "VALIDATION_ERROR",
        message: "Şifre veya 2FA token gerekli",
        statusCode: 400,
      } as any);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        password: true,
        twoFactorEnabled: true,
        twoFactorSecret: true,
      },
    });
    if (!user) {
      await bcrypt.compare(password ?? "", BCRYPT_INVALID_HASH);
      return fail({
        code: "NOT_FOUND",
        message: "Kullanıcı bulunamadı",
        statusCode: 404,
      } as any);
    }

    // Re-authentication
    let reauthOk = false;
    if (password && user.password) {
      reauthOk = await bcrypt.compare(password, user.password);
    } else if (token && user.twoFactorSecret) {
      reauthOk = twoFactor.verifyToken(token, user.twoFactorSecret);
    }
    if (!reauthOk) {
      await bcrypt.compare(password ?? "", BCRYPT_INVALID_HASH);
      return fail({
        code: "AUTH_FAILED",
        message: "Şifre veya token hatalı",
        statusCode: 401,
      } as any);
    }

    if (!user.twoFactorEnabled) {
      return fail({
        code: "NOT_ENABLED",
        message: "2FA zaten devre dışı",
        statusCode: 400,
      } as any);
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: Prisma.JsonNull,
        twoFactorVerifiedAt: null,
      },
    });

    await logAudit({
      userId,
      userEmail: user.email,
      action: "SETTINGS_UPDATE",
      resource: "user_2fa",
      resourceId: userId,
      details: { event: "2fa_disabled" },
    });

    logger.info("2FA disabled", { userId });
    return ok({ enabled: false });
  });
}

// Prisma'nin JsonNull importu icin
import { Prisma } from "@prisma/client";
