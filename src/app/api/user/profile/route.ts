/**
 * PATCH /api/user/profile — kullanıcının profil bilgilerini (isim) günceller.
 *
 * Body: { name: string (2..100) }
 * Auth: zorunlu (NextAuth session)
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';
import { logger } from '@/lib/logger';

const UpdateProfileSchema = z.object({
  name: z.string().trim().min(2, 'İsim en az 2 karakter').max(100, 'İsim en fazla 100 karakter'),
});

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

    const data = UpdateProfileSchema.parse(body);

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { name: data.name },
      select: { id: true, email: true, name: true, image: true },
    });

    logger.info('Profile updated', { userId });
    return ok({ user: updated });
  });
}