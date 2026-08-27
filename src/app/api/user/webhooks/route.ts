/**
 * @file Webhooks — Collection Endpoint
 * @description GET: kullanıcının webhook'larını listele (secret masked).
 *              POST: yeni webhook oluştur (secret bir kez döner).
 */

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { webhookService } from '@/modules/webhooks';
import { CreateWebhookSchema } from '@/modules/webhooks/schemas';
import { ok, created, withErrorHandling } from '@/lib/apiResponse';
import { UnauthorizedError } from '@/modules/shared/errors';

export async function GET(_req: NextRequest) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new UnauthorizedError('Giriş gerekli');
    const userId = (session.user as any).id as string;

    const webhooks = await webhookService.listWebhooks(userId);
    // Mask full secret — sadece ilk 8 karakter + '...'
    const masked = webhooks.map((w: any) => ({
      ...w,
      secret: `${w.secret.substring(0, 8)}...`,
    }));
    return ok({ webhooks: masked });
  });
}

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new UnauthorizedError('Giriş gerekli');
    const userId = (session.user as any).id as string;

    const body = await req.json();
    const data = CreateWebhookSchema.parse(body);

    const webhook = await webhookService.createWebhook(userId, data);
    return created({
      webhook,
      warning: 'Secret\'ı şimdi kaydedin. Bir daha gösterilmeyecek.',
    });
  });
}
