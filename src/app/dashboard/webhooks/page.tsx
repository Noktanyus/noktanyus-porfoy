/**
 * Dashboard — Webhook yönetimi + test playground
 */

import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { webhookService } from '@/modules/webhooks';
import { PageHeader } from '@/components/dashboard/PageHeader';
import WebhooksPanel, { type WebhookRow } from '@/components/dashboard/WebhooksPanel';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function WebhooksPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/giris?callbackUrl=/dashboard/webhooks');

  const userId = (session.user as { id: string }).id;
  const [raw, recentDeliveries, deadLetters] = await Promise.all([
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
        responseStatus: true,
        errorMessage: true,
        createdAt: true,
        webhook: { select: { url: true } },
      },
    }),
    webhookService.getDeadLetter(userId),
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
        description="Olay abonelikleri, HMAC imza ve tek tıkla test teslimatı"
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

      <section className="rounded-2xl border border-border bg-card/50 p-5 space-y-3">
        <h2 className="text-base font-bold">Son teslimatlar</h2>
        {recentDeliveries.length === 0 ? (
          <p className="text-sm text-muted-foreground">Henüz teslimat yok. Test butonu ile dene.</p>
        ) : (
          <ul className="divide-y divide-border text-sm">
            {recentDeliveries.map((d) => (
              <li key={d.id} className="py-2 flex flex-wrap justify-between gap-2">
                <div>
                  <span className="font-mono text-xs">{d.event}</span>
                  <span className="text-muted-foreground ml-2 text-xs truncate max-w-[200px] inline-block align-bottom">
                    {d.webhook.url}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {d.status}
                  {d.responseStatus != null ? ` · HTTP ${d.responseStatus}` : ''}
                  {d.attempts > 1 ? ` · ${d.attempts} deneme` : ''}
                  {' · '}
                  {d.createdAt.toLocaleString('tr-TR')}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {deadLetters.length > 0 && (
        <section className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 space-y-3">
          <h2 className="text-base font-bold text-destructive">Dead letter ({deadLetters.length})</h2>
          <ul className="space-y-2 text-sm">
            {deadLetters.slice(0, 10).map((d) => (
              <li key={d.id} className="border border-border rounded-xl px-3 py-2">
                <span className="font-mono text-xs">{d.event}</span>
                <p className="text-xs text-muted-foreground mt-1">
                  {d.errorMessage ?? 'Max attempts aşıldı'}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
