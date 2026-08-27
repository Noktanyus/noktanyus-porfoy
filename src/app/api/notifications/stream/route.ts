/**
 * Notifications SSE Stream
 *
 * Server-Sent Events endpoint. Bağlı kullanıcıya 10 saniyede bir
 * son 10 bildirimini push'lar. İlk bağlantıda anlık veri gönderir.
 *
 * Production'da daha gelişmiş bir event bus (Redis pub/sub) ile
 * gerçek push tetiklenebilir; bu MVP'de polling yaklaşımı yeterli.
 */

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { notificationService } from '@/modules/notifications';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }
  const userId = (session.user as any).id;
  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;

      const send = async () => {
        if (closed) return;
        try {
          const notifications = await notificationService.list(userId, 10);
          const data = encoder.encode(
            JSON.stringify({
              type: 'notifications',
              notifications,
            })
          );
          controller.enqueue(`data: ${data}\n\n`);
        } catch (err) {
          logger.error('SSE notification fetch error', { error: err });
        }
      };

      // Heartbeat: connection alive tutmak için 25 saniyede ping
      const heartbeat = setInterval(() => {
        if (closed) return;
        try {
          controller.enqueue(`: ping\n\n`);
        } catch {
          // ignore
        }
      }, 25_000);

      // İlk gönder
      await send();

      // 10 saniyede bir listeyi tekrar gönder (polling yaklaşımı)
      const interval = setInterval(send, 10_000);

      const cleanup = () => {
        if (closed) return;
        closed = true;
        clearInterval(interval);
        clearInterval(heartbeat);
        try {
          controller.close();
        } catch {
          // already closed
        }
      };

      req.signal.addEventListener('abort', cleanup);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
