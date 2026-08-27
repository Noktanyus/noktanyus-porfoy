/**
 * @file Webhook — Rotate Secret Endpoint
 * @description POST: yeni secret üret, bir kez döndür (eski secret invalidate olur).
 */

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { webhookService } from '@/modules/webhooks';
import { ok, withErrorHandling } from '@/lib/apiResponse';
import { UnauthorizedError } from '@/modules/shared/errors';

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new UnauthorizedError('Giriş gerekli');
    const userId = (session.user as any).id as string;

    const webhook = await webhookService.rotateSecret(userId, params.id);
    return ok({
      webhook,
      warning: 'Yeni secret\'ı şimdi kaydedin. Eski secret artık geçersiz.',
    });
  });
}
