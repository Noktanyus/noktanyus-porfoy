import type { Metadata } from 'next';
import Link from 'next/link';
import { API_VERSION } from '@/lib/apiVersion';

export const metadata: Metadata = {
  title: 'API versiyonlama — Noktanyus',
  description:
    'X-API-Version, Deprecation ve Sunset başlıkları; breaking change politikası.',
  alternates: { canonical: '/docs/versioning' },
};

export default function VersioningDocsPage() {
  return (
    <div className="relative bg-blob-decoration min-h-[70vh]">
      <div className="container-responsive py-10 sm:py-14 relative z-10 max-w-3xl space-y-8">
        <nav className="text-sm text-slate-500 dark:text-slate-400" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-brand-primary">
            Ana sayfa
          </Link>
          <span className="mx-2">/</span>
          <Link href="/docs" className="hover:text-brand-primary">
            Docs
          </Link>
          <span className="mx-2">/</span>
          <span>Versiyonlama</span>
        </nav>

        <header className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-primary">
            API lifecycle
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            API versiyonlama
          </h1>
          <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            Güncel sözleşme tarihi:{' '}
            <code className="text-sm font-semibold text-foreground">{API_VERSION}</code>
            . Tüm kimlik doğrulamalı TR API yanıtlarında{' '}
            <code className="text-xs">X-API-Version</code> ve{' '}
            <code className="text-xs">API-Version</code> başlıkları döner.
          </p>
        </header>

        <section className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
          <h2 className="text-lg font-bold text-foreground">Başlıklar</h2>
          <ul className="space-y-2">
            <li className="rounded-xl border border-border px-4 py-3">
              <code className="font-mono text-brand-primary">X-API-Version</code> /{' '}
              <code className="font-mono text-brand-primary">API-Version</code>
              <p className="mt-1">Tarih tabanlı sözleşme kimliği (YYYY-MM-DD).</p>
            </li>
            <li className="rounded-xl border border-border px-4 py-3">
              <code className="font-mono text-brand-primary">Deprecation: true</code>
              <p className="mt-1">
                Uç kullanımdan kaldırılacaksa. İsteğe bağlı{' '}
                <code className="text-xs">Sunset</code> ve{' '}
                <code className="text-xs">Link rel=&quot;successor-version&quot;</code>.
              </p>
            </li>
          </ul>
        </section>

        <section className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
          <h2 className="text-lg font-bold text-foreground">Politika</h2>
          <p>
            Kırıcı değişiklikler <Link href="/changelog" className="text-brand-primary hover:underline">changelog</Link>
            ’da <strong>breaking</strong> etiketiyle duyurulur. Mümkün olduğunca eski davranış
            geçiş süresince paralel tutulur; agent yüzeyleri için{' '}
            <Link href="/docs/md" className="text-brand-primary hover:underline">
              /docs/md
            </Link>{' '}
            ve{' '}
            <Link href="/llms.txt" className="text-brand-primary hover:underline">
              llms.txt
            </Link>{' '}
            güncellenir.
          </p>
        </section>

        <section className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
          <h2 className="text-lg font-bold text-foreground">IP allowlist</h2>
          <p>
            Anahtar başına IP / CIDR kısıtı:{' '}
            <Link href="/dashboard/api-keys" className="text-brand-primary hover:underline">
              Dashboard → API keys
            </Link>
            . Eşleşmeyen istemci{' '}
            <code className="text-xs">403 IP_NOT_ALLOWED</code> alır.
          </p>
        </section>
      </div>
    </div>
  );
}
