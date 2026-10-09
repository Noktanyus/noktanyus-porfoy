/**
 * POST /api/user/webhooks/[id]/test — örnek olay gönder (webhook playground)
 */

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { webhookService } from '@/modules/webhooks';
import { WebhookEventSchema } from '@/modules/webhooks/schemas';
import { ok, withErrorHandling } from '@/lib/apiResponse';
import { UnauthorizedError, ValidationError } from '@/modules/shared/errors';

export const dynamic = 'force-dynamic';

const BodySchema = z.object({
  event: WebhookEventSchema.optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new UnauthorizedError('Giriş gerekli');
    const userId = (session.user as { id: string }).id;

    const webhook = await webhookService.getWebhook(userId, params.id);
    if (!webhook.active) {
      throw new ValidationError('Pasif webhook’a test gönderilemez');
    }

    const json = await req.json().catch(() => ({}));
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      throw new ValidationError('Geçersiz istek gövdesi');
    }

    const events = Array.isArray(webhook.events) ? (webhook.events as string[]) : [];
    const requested = parsed.data.event;
    const event =
      requested && events.includes(requested)
        ? requested
        : events[0];

    if (!event || !WebhookEventSchema.safeParse(event).success) {
      throw new ValidationError('Webhook’ta test edilecek olay yok');
    }

    const payload = {
      test: true,
      message: 'Noktanyus webhook test olayı',
      webhookId: webhook.id,
      sentAt: new Date().toISOString(),
    };

    await webhookService.deliverWebhook(webhook.id, event, payload);

    const deliveries = await webhookService.getDeliveries(userId, webhook.id);
    const latest = deliveries[0] ?? null;

    return ok({
      sent: true,
      event,
      delivery: latest
        ? {
            id: latest.id,
            status: latest.status,
            attempts: latest.attempts,
            responseStatus: latest.responseStatus,
            errorMessage: latest.errorMessage,
            deliveredAt: latest.deliveredAt?.toISOString() ?? null,
          }
        : null,
    });
  });
}
