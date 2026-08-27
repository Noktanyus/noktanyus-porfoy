/**
 * PATCH /api/user/password — kullanıcının şifresini günceller.
 *
 * Body: { currentPassword: string, newPassword: string (8..100) }
 * Auth: zorunlu (NextAuth session)
 *
 * - Mevcut şifre bcrypt ile doğrulanır (timing attack koruması: hatalı user'da da
 *   karşılaştırma yapılır)
 * - Yeni şifre bcrypt rounds=12 ile hash'lenir
 * - Hassas veri (şifre) log'a yazılmaz
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';
import { logger } from '@/lib/logger';

const UpdatePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Mevcut şifre gerekli'),
  newPassword: z
    .string()
    .min(8, 'Yeni şifre en az 8 karakter')
    .max(100, 'Yeni şifre en fazla 100 karakter'),
});

const BCRYPT_INVALID_HASH = '$2a$12$invalidsaltinvalidsaltinvO5gQUxjCz0VOZmC9OgN8HkaaHAXk.';

export async function PATCH(req: NextRequest) {
  return withErrorHandling<unknown>(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return fail({ code: 'UNAUTHORIZED', message: 'Giriş gerekli', statusCode: 401 } as any);
    }
    const userId = (session.user as any).id;
    if (!userId) {
      return fail({ code: 'UNAUTHORIZED', message: 'Geçersiz oturum', statusCode: 401 } as any);
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return fail({ code: 'VALIDATION_ERROR', message: 'Geçersiz JSON gövdesi', statusCode: 400 } as any);
    }

    const { currentPassword, newPassword } = UpdatePasswordSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, password: true },
    });

    if (!user) {
      // Kullanıcı yoksa timing attack'a karşı yine de bcrypt çalıştır
      await bcrypt.compare(currentPassword, BCRYPT_INVALID_HASH);
      return fail({ code: 'NOT_FOUND', message: 'Kullanıcı bulunamadı', statusCode: 404 } as any);
    }

    // OAuth ile kayıtlı kullanıcılarda password null olabilir
    if (!user.password) {
      return fail(
        { code: 'NO_PASSWORD', message: 'Bu hesap sosyal giriş kullanıyor, şifre ayarlanamaz', statusCode: 400 } as any
      );
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return fail({ code: 'INVALID_PASSWORD', message: 'Mevcut şifre hatalı', statusCode: 400 } as any);
    }

    if (currentPassword === newPassword) {
      return fail(
        { code: 'SAME_PASSWORD', message: 'Yeni şifre mevcut şifreden farklı olmalı', statusCode: 400 } as any
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    // Hassas veri loglanmaz; sadece kullanıcı ID ve zaman
    logger.info('Password changed', { userId, timestamp: new Date().toISOString() });
    return ok({ success: true });
  });
}