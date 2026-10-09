/**
 * Dashboard — Webhook yönetimi + test playground
 */

import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import { webhookService } from '@/modules/webhooks';
import { PageHeader } from '@/components/dashboard/PageHeader';
import WebhooksPanel, { type WebhookRow } from '@/components/dashboard/WebhooksPanel';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function WebhooksPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/giris?callbackUrl=/dashboard/webhooks');

  const userId = (session.user as { id: string }).id;
  const raw = await webhookService.listWebhooks(userId);

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
          <Link href="/docs/hatalar" className="admin-btn admin-btn-secondary">
            API hataları
          </Link>
        }
      />
      <p className="text-sm text-muted-foreground rounded-xl border border-border/70 bg-muted/20 px-4 py-3">
        Teslimat başlıkları: <code className="text-xs">X-Webhook-Signature</code> (sha256=…),{' '}
        <code className="text-xs">X-Webhook-Event</code>,{' '}
        <code className="text-xs">X-Webhook-Delivery-Id</code>. Doğrulama için secret’ı güvenli sakla.
      </p>
      <WebhooksPanel initial={initial} />
    </div>
  );
}
