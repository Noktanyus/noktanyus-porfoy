/**
 * @file Webhook — Single Resource Endpoint
 * @description GET: tek webhook getir.
 *              PATCH: webhook güncelle.
 *              DELETE: webhook sil.
 */

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { webhookService } from '@/modules/webhooks';
import { UpdateWebhookSchema } from '@/modules/webhooks/schemas';
import { ok, withErrorHandling } from '@/lib/apiResponse';
import { UnauthorizedError } from '@/modules/shared/errors';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new UnauthorizedError('Giriş gerekli');
    const userId = (session.user as any).id as string;

    const webhook = await webhookService.getWebhook(userId, params.id);
    return ok({
      webhook: {
        ...webhook,
        secret: `${webhook.secret.substring(0, 8)}...`,
      },
    });
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new UnauthorizedError('Giriş gerekli');
    const userId = (session.user as any).id as string;

    const body = await req.json();
    const data = UpdateWebhookSchema.parse(body);

    const webhook = await webhookService.updateWebhook(userId, params.id, data);
    return ok({
      webhook: {
        ...webhook,
        secret: `${webhook.secret.substring(0, 8)}...`,
      },
    });
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new UnauthorizedError('Giriş gerekli');
    const userId = (session.user as any).id as string;

    await webhookService.deleteWebhook(userId, params.id);
    return ok({ success: true });
  });
}
