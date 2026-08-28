/**
 * /api/user/preferences
 *
 * GET  — Kullanicinin tema + accent tercihlerini getir (auth required).
 * PATCH — Tercihleri kismi guncelle (en az bir alan zorunlu).
 *
 * Auth: zorunlu (NextAuth session).
 */

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ok, withErrorHandling } from '@/lib/apiResponse';
import { UnauthorizedError, ValidationError } from '@/lib/errors';
import { userPreferencesService, UpdatePreferencesSchema } from '@/modules/user-preferences';

export const dynamic = 'force-dynamic';

/**
 * Auth + userId kontrolu. Yoksa UnauthorizedError firlatir.
 */
async function requireUserId(): Promise<string> {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new UnauthorizedError('Giriş gerekli');
  const userId = (session.user as { id?: string }).id;
  if (!userId) throw new UnauthorizedError('Geçersiz oturum');
  return userId;
}

export async function GET(_req: NextRequest) {
  return withErrorHandling(async () => {
    const userId = await requireUserId();
    const prefs = await userPreferencesService.getPreferences(userId);
    return ok({ preferences: prefs });
  });
}

export async function PATCH(req: NextRequest) {
  return withErrorHandling(async () => {
    const userId = await requireUserId();

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new ValidationError('Geçersiz JSON gövdesi');
    }

    const data = UpdatePreferencesSchema.parse(body);

    const prefs = await userPreferencesService.updatePreferences(userId, {
      ...(data.theme !== undefined ? { theme: data.theme } : {}),
      ...(data.accentColor !== undefined ? { accentColor: data.accentColor } : {}),
    });

    return ok({ preferences: prefs });
  });
}