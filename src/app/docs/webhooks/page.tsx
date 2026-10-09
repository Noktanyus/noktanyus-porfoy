import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Webhooks — Noktanyus',
  description:
    'HMAC imza doğrulama, olay tipleri, Retry-After ve dashboard test playground.',
  alternates: { canonical: '/docs/webhooks' },
};

const VERIFY = `import crypto from 'crypto';

function verify(rawBody: string, signatureHeader: string, secret: string) {
  const expected = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');
  // timing-safe karşılaştırma kullan
  return crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(signatureHeader)
  );
}`;

export default function WebhooksDocsPage() {
  return (
    <div className="relative bg-blob-decoration min-h-[70vh]">
      <div className="container-responsive py-10 sm:py-14 relative z-10 max-w-3xl">
        <nav className="text-sm text-slate-500 dark:text-slate-400 mb-6" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-brand-primary">
            Ana sayfa
          </Link>
          <span className="mx-2" aria-hidden="true">
            /
          </span>
          <Link href="/docs" className="hover:text-brand-primary">
            Docs
          </Link>
          <span className="mx-2" aria-hidden="true">
            /
          </span>
          <span>Webhooks</span>
        </nav>

        <header className="mb-8 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-primary">
            Event delivery
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Webhooks</h1>
          <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            Sipariş, abonelik ve monitör olaylarını kendi endpoint’ine HMAC imzalı POST olarak alır.
            Dashboard’dan tek tıkla test teslimatı yapabilirsin.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard/webhooks"
              className="inline-flex min-h-[44px] items-center rounded-xl bg-brand-primary px-4 py-2 text-sm font-semibold text-white"
            >
              Webhook yönet
            </Link>
            <Link
              href="/docs/hatalar"
              className="inline-flex min-h-[44px] items-center rounded-xl border border-border px-4 py-2 text-sm font-semibold"
            >
              Hata kodları
            </Link>
          </div>
        </header>

        <section className="mb-8 space-y-3">
          <h2 className="text-lg font-bold">Başlıklar</h2>
          <ul className="space-y-2 text-sm">
            <li className="rounded-xl border border-border px-4 py-3">
              <code className="font-mono text-brand-primary">X-Webhook-Signature</code>
              <p className="mt-1 text-slate-600 dark:text-slate-300">
                <code className="text-xs">sha256=&lt;hmac-hex&gt;</code> — ham JSON gövde üzerinden
              </p>
            </li>
            <li className="rounded-xl border border-border px-4 py-3">
              <code className="font-mono text-brand-primary">X-Webhook-Event</code>
              <p className="mt-1 text-slate-600 dark:text-slate-300">
                Örn. <code className="text-xs">order.paid</code>,{' '}
                <code className="text-xs">monitor.down</code>,{' '}
                <code className="text-xs">monitor.up</code>
              </p>
            </li>
            <li className="rounded-xl border border-border px-4 py-3">
              <code className="font-mono text-brand-primary">X-Webhook-Delivery-Id</code>
              <p className="mt-1 text-slate-600 dark:text-slate-300">
                İdempotency / log korelasyonu için benzersiz teslimat kimliği
              </p>
            </li>
          </ul>
        </section>

        <section className="mb-8 space-y-3">
          <h2 className="text-lg font-bold">İmza doğrulama (Node)</h2>
          <pre className="overflow-x-auto rounded-2xl bg-slate-950 text-slate-100 p-4 text-[12px] sm:text-sm font-mono leading-relaxed">
            {VERIFY}
          </pre>
        </section>

        <section className="mb-8 space-y-2 text-sm text-slate-600 dark:text-slate-300">
          <h2 className="text-lg font-bold text-foreground">Monitör olayları</h2>
          <p>
            Saatlik cron uptime kontrolünde durum değişince yalnızca hesabının webhook’larına
            <code className="text-xs mx-1">monitor.down</code> /{' '}
            <code className="text-xs">monitor.up</code> gönderilir. Oluşturma/silme:{' '}
            <code className="text-xs">monitor.created</code>,{' '}
            <code className="text-xs">monitor.deleted</code>.
          </p>
        </section>

        <section className="mb-8 space-y-2 text-sm text-slate-600 dark:text-slate-300">
          <h2 className="text-lg font-bold text-foreground">Retry</h2>
          <p>
            Başarısız teslimatlar üstel geri çekilme ile en fazla 5 kez denenir; sonra dead-letter’a
            düşer. Endpoint’in 2xx dönmesi gerekir.
          </p>
        </section>

        <p className="text-sm text-slate-500">
          Olay aboneliği:{' '}
          <Link href="/dashboard/webhooks" className="text-brand-primary hover:underline">
            /dashboard/webhooks
          </Link>
        </p>
      </div>
    </div>
  );
}
