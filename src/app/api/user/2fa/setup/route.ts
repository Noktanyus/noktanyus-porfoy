/**
 * POST /api/user/2fa/setup — 2FA icin yeni bir TOTP secret'i + QR kod + backup
 * kodlari uretir. Henuz 2FA'yi AKTIVE ETMEZ. Aktivasyon icin /verify endpoint'i
 * kullanici tarafindan girilen 6 haneli token'i dogruladiktan sonra olur.
 *
 * Body: bos olabilir (sadece session yeterli)
 * Response: { secret, qrCode, backupCodes }
 *
 * - Sadece oturum acmis kullanici kendi hesabi icin setup yapabilir.
 * - Eger 2FA zaten aktifse, mevcut secret korunur (yeni setup iptal edilir).
 * - Backup kodlari sadece BU response'ta bir kez dondurulur; veritabanina
 *   sadece SHA256 hash'leri kaydedilir.
 */

import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, fail, withErrorHandling } from "@/lib/apiResponse";
import { twoFactor } from "@/lib/twoFactor";
import { logger } from "@/lib/logger";

export async function POST(_req: NextRequest) {
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

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, twoFactorEnabled: true },
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
        message: "2FA zaten aktif. Önce devre dışı bırakın.",
        statusCode: 400,
      } as any);
    }

    const secret = twoFactor.generateSecret();
    const qrCode = await twoFactor.generateQRCode(user.email, secret);
    const backupCodes = twoFactor.generateBackupCodes(10);
    const hashedBackupCodes = await twoFactor.hashBackupCodes(backupCodes);

    // Secret + backup code hash'lerini henuz "aktif degil" sekilde kaydet.
    // Verify basarili olunca twoFactorEnabled=true olacak.
    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorSecret: secret,
        twoFactorBackupCodes: hashedBackupCodes,
      },
    });

    logger.info("2FA setup initiated", { userId });

    return ok({
      secret,
      qrCode,
      backupCodes, // SADECE BU RESPONSE'TA - sonra tekrar dondurulmez
    });
  });
}
