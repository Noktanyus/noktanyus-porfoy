/**
 * User Email Preferences API
 *
 * GET   — Oturum acan kullanicinin tercihleri (yoksa default).
 * PATCH — Tercihleri guncelle (upsert).
 */

import type { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { emailMarketingService } from '@/modules/email-marketing/service';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';

const DEFAULT_PREFS = {
  marketing: true,
  transactional: true,
  newsletter: true,
};

export async function GET(_req: NextRequest) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return ok({ preferences: DEFAULT_PREFS });
    }
    const userId = session.user.id;

    const prefs = await emailMarketingService.getPreferences(userId);
    return ok({ preferences: prefs ?? DEFAULT_PREFS });
  });
}

export async function PATCH(req: NextRequest) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return fail({ code: 'UNAUTHORIZED', message: 'Giriş gerekli', statusCode: 401 });
    }
    const userId = session.user.id;

    const body = await req.json();
    const preferences = await emailMarketingService.updatePreferences(userId, body);

    return ok({ preferences });
  });
}