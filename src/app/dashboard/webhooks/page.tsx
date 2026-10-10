/**
 * Dashboard — Webhook yönetimi + başarısız teslimat / DLQ UX
 */

import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  webhookService,
  formatDeliveryStatusTr,
  formatDeliveryAttemptsTr,
  formatDeliveryLastError,
  isReplayableDeliveryStatus,
} from '@/modules/webhooks';
import { PageHeader } from '@/components/dashboard/PageHeader';
import WebhooksPanel, { type WebhookRow } from '@/components/dashboard/WebhooksPanel';
import { WebhookReplayButton } from '@/components/dashboard/WebhookReplayButton';
import { WebhookHmacPlayground } from '@/components/dashboard/WebhookHmacPlayground';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function WebhooksPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/giris?callbackUrl=/dashboard/webhooks');

  const userId = (session.user as { id: string }).id;
  const [raw, recentDeliveries, failedDeliveries] = await Promise.all([
    webhookService.listWebhooks(userId),
    prisma.webhookDelivery.findMany({
      where: { webhook: { userId } },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        event: true,
        status: true,
        attempts: true,
        maxAttempts: true,
        responseStatus: true,
        errorMessage: true,
        createdAt: true,
        webhook: { select: { url: true } },
      },
    }),
    webhookService.getFailedDeliveries(userId, 30),
  ]);

  const initial: WebhookRow[] = raw.map((w) => ({
    id: w.id,
    url: w.url,
    description: w.description,
    events: Array.isArray(w.events) ? (w.events as string[]) : [],
    active: w.active,
    secret: `${String(w.secret).substring(0, 8)}...`,
    createdAt: w.createdAt.toISOString(),
    successCount: (w as { successCount?: number }).successCount,
    failureCount: (w as { failureCount?: number }).failureCount,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Webhooks"
        description="Olay abonelikleri, HMAC imza ve başarısız teslimatları yeniden deneme"
        actions={
          <Link href="/docs/webhooks" className="admin-btn admin-btn-secondary">
            Webhook docs
          </Link>
        }
      />
      <p className="text-sm text-muted-foreground rounded-xl border border-border/70 bg-muted/20 px-4 py-3">
        Teslimat başlıkları: <code className="text-xs">X-Webhook-Signature</code> (sha256=…),{' '}
        <code className="text-xs">X-Webhook-Event</code>,{' '}
        <code className="text-xs">X-Webhook-Delivery-Id</code>. Doğrulama için secret’ı güvenli sakla.
      </p>
      <WebhooksPanel initial={initial} />
      <WebhookHmacPlayground />

      {failedDeliveries.length > 0 && (
        <section className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 space-y-3">
          <h2 className="text-base font-bold text-destructive">
            Başarısız teslimatlar ({failedDeliveries.length})
          </h2>
          <p className="text-xs text-muted-foreground">
            Başarısız, yeniden denenen veya dead-letter kayıtları. Yeniden dene aynı payload ile yeni
            teslimat oluşturur.
          </p>
          <ul className="space-y-2 text-sm">
            {failedDeliveries.map((d) => (
              <li
                key={d.id}
                className="border border-border rounded-xl px-3 py-2.5 flex flex-wrap items-start justify-between gap-3 bg-card/40"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs">{d.event}</span>
                    <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-semibold">
                      {formatDeliveryStatusTr(d.status)}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {formatDeliveryAttemptsTr(d.attempts, d.maxAttempts)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono truncate max-w-[min(100%,28rem)]">
                    {d.webhook.url}
                  </p>
                  <p className="text-xs text-rose-700 dark:text-rose-300">
                    Son hata: {formatDeliveryLastError(d.errorMessage, d.responseStatus)}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {d.createdAt.toLocaleString('tr-TR')}
                    {d.nextRetryAt
                      ? ` · sonraki deneme ${d.nextRetryAt.toLocaleString('tr-TR')}`
                      : ''}
                  </p>
                </div>
                {isReplayableDeliveryStatus(d.status) && d.webhook.active && (
                  <WebhookReplayButton deliveryId={d.id} />
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-2xl border border-border bg-card/50 p-5 space-y-3">
        <h2 className="text-base font-bold">Son teslimatlar</h2>
        {recentDeliveries.length === 0 ? (
          <p className="text-sm text-muted-foreground">Henüz teslimat yok. Test butonu ile dene.</p>
        ) : (
          <ul className="divide-y divide-border text-sm">
            {recentDeliveries.map((d) => (
              <li key={d.id} className="py-2 flex flex-wrap justify-between gap-2 items-center">
                <div className="min-w-0">
                  <span className="font-mono text-xs">{d.event}</span>
                  <span className="text-muted-foreground ml-2 text-xs truncate max-w-[200px] inline-block align-bottom">
                    {d.webhook.url}
                  </span>
                  {isReplayableDeliveryStatus(d.status) && (
                    <p className="text-[11px] text-rose-700 dark:text-rose-300 mt-0.5">
                      {formatDeliveryLastError(d.errorMessage, d.responseStatus)}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-xs text-muted-foreground text-right">
                    {formatDeliveryStatusTr(d.status)}
                    {d.responseStatus != null ? ` · HTTP ${d.responseStatus}` : ''}
                    {' · '}
                    {formatDeliveryAttemptsTr(d.attempts, d.maxAttempts)}
                    {' · '}
                    {d.createdAt.toLocaleString('tr-TR')}
                  </div>
                  {isReplayableDeliveryStatus(d.status) && (
                    <WebhookReplayButton deliveryId={d.id} />
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
