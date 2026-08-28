/**
 * /api/push/subscribe
 *
 * POST   — Kullanicinin push subscription'ini kaydeder.
 * DELETE — Kullanicinin push subscription'ini pasif yapar.
 *
 * Auth: getServerSession ile kullanici kimligi zorunlu.
 */

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ok, created, withErrorHandling } from '@/lib/apiResponse';
import {
  pushService,
  pushRepository,
  SubscribePushSchema,
  UnsubscribePushSchema,
} from '@/modules/push-notifications';
import { ForbiddenError, UnauthorizedError, ValidationError } from '@/lib/errors';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getUserId(): Promise<string> {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new UnauthorizedError('Giris gerekli');
  const userId = (session.user as any).id as string | undefined;
  if (!userId) throw new UnauthorizedError('Giris gerekli');
  return userId;
}

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const userId = await getUserId();

    // Admin hesap push abonesi olamaz (user tablosunda satir yok).
    if (userId === 'admin') {
      throw new ValidationError('Push sadece kayitli kullanicilar icin aktif');
    }

    const body = await req.json().catch(() => null);
    const parsed = SubscribePushSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError('Gecersiz subscription bilgisi', parsed.error.flatten());
    }

    const sub = await pushService.subscribe(userId, {
      endpoint: parsed.data.endpoint,
      p256dh: parsed.data.keys.p256dh,
      auth: parsed.data.keys.auth,
    });

    return created({ id: sub.id, active: sub.active });
  });
}

export async function DELETE(req: NextRequest) {
  return withErrorHandling(async () => {
    const userId = await getUserId();

    const body = await req.json().catch(() => null);
    const parsed = UnsubscribePushSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError('Gecersiz istek', parsed.error.flatten());
    }

    // Guvenlik: sadece kendi subscription'ini silebilir.
    const existing = await pushRepository.findByEndpoint(parsed.data.endpoint);
    if (!existing) {
      return ok({ deactivated: 0 });
    }
    if (existing.userId !== userId) {
      throw new ForbiddenError('Bu subscription size ait degil');
    }

    const result = await pushService.unsubscribe(parsed.data.endpoint);
    return ok({ deactivated: result.count });
  });
}