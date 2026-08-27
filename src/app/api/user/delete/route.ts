/**
 * DELETE /api/user/delete — kullanıcı hesabını siler (GDPR/KVKK uyumlu kalıcı silme).
 *
 * Body: { password: string }
 * Auth: zorunlu (NextAuth session)
 *
 * Güvenlik:
 *   - Şifre tekrar doğrulanır (session ele geçirilse bile koruma)
 *   - Prisma cascade kuralları User.accounts/sessions/apiKeys/monitors/
 *     alertChannels/subscriptions/statusPages için otomatik siler
 *   - User'a bağlı Customer/Order/License/AuditLog/Workspace gibi
 *     cascade'siz kayıtlar varsa prisma P2003 fırlatır; kullanıcıya
 *     anlaşılır hata döneriz.
 *   - Hassas veri (şifre) loglanmaz
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';
import { logger } from '@/lib/logger';

const DeleteAccountSchema = z.object({
  password: z.string().min(1, 'Şifre gerekli'),
});

const BCRYPT_INVALID_HASH = '$2a$12$invalidsaltinvalidsaltinvO5gQUxjCz0VOZmC9OgN8HkaaHAXk.';

export async function DELETE(req: NextRequest) {
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

    const { password } = DeleteAccountSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, password: true },
    });

    if (!user) {
      await bcrypt.compare(password, BCRYPT_INVALID_HASH);
      return fail({ code: 'NOT_FOUND', message: 'Kullanıcı bulunamadı', statusCode: 404 } as any);
    }

    if (!user.password) {
      return fail(
        { code: 'NO_PASSWORD', message: 'Bu hesap sosyal giriş kullanıyor, silme desteklenmiyor', statusCode: 400 } as any
      );
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return fail({ code: 'INVALID_PASSWORD', message: 'Şifre hatalı', statusCode: 400 } as any);
    }

    // Cascade delete: accounts/sessions/apiKeys/monitors/alertChannels/
    // subscriptions/statusPages Prisma cascade kurallarıyla otomatik silinir.
    // User'a bağlı ama cascade'siz kayıtlar varsa P2003 fırlatır.
    try {
      await prisma.user.delete({ where: { id: userId } });
    } catch (err: any) {
      if (err?.code === 'P2003') {
        logger.warn('Account deletion blocked by related records', { userId, email: user.email });
        return fail(
          {
            code: 'DELETE_BLOCKED',
            message:
              'Hesabınız aktif siparişler/abonelikler içerdiğinden silinemiyor. Lütfen önce bu kayıtları kapatın veya destek ekibiyle iletişime geçin.',
            statusCode: 409,
          } as any
        );
      }
      throw err;
    }

    logger.info('User account deleted', { userId, email: user.email });
    return ok({ success: true });
  });
}