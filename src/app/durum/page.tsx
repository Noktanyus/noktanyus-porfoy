import type { Metadata } from 'next';
import Link from 'next/link';
import StatusClient from './StatusClient';

export const metadata: Metadata = {
  title: 'Sistem durumu — Noktanyus',
  description:
    'Noktanyus API, docs ve araçların operasyonel durumu. Anlık sağlık kontrolü.',
  alternates: { canonical: '/durum' },
  openGraph: {
    title: 'Sistem durumu — Noktanyus',
    description: 'API ve site sağlık durumu.',
    url: 'https://noktanyus.com/durum',
  },
};

const COMPONENTS = [
  {
    id: 'web',
    name: 'Web / App Router',
    detail: 'Ana site, dashboard ve araç sayfaları',
    href: '/',
  },
  {
    id: 'api',
    name: 'Public API (/api/v1)',
    detail: 'IBAN, kimlik, KDV ve yardımcı uçlar',
    href: '/docs',
  },
  {
    id: 'docs',
    name: 'OpenAPI / Docs',
    detail: 'Redoc referansı ve openapi.json',
    href: '/docs',
  },
  {
    id: 'auth',
    name: 'Kimlik doğrulama',
    detail: 'E-posta ve Google OAuth oturumları',
    href: '/giris',
  },
  {
    id: 'billing',
    name: 'Ödeme (PayTR)',
    detail: 'Plan ve kredi tahsilatı',
    href: '/magaza',
  },
] as const;

export default function DurumPage() {
  return (
    <div className="relative bg-blob-decoration min-h-[70vh]">
      <div className="container-responsive py-10 sm:py-14 relative z-10 max-w-3xl">
        <nav className="text-sm text-slate-500 dark:text-slate-400 mb-6" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-brand-primary">
            Ana sayfa
          </Link>
          <span aria-hidden="true" className="mx-2">
            /
          </span>
          <span>Durum</span>
        </nav>

        <header className="mb-8 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-primary">
            Operations
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            Sistem durumu
          </h1>
          <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            Stripe / Twilio tarzı şeffaflık: kritik bileşenler ve canlı sağlık kontrolü.
            Kesinti duyurusu varsa burada görünür.
          </p>
        </header>

        <StatusClient components={[...COMPONENTS]} />

        <div className="mt-6 rounded-2xl border border-border bg-card/40 px-4 py-4 flex flex-wrap items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/api/health/badge"
            alt="Noktanyus durum rozeti"
            width={140}
            height={20}
            className="h-5 w-auto"
          />
          <code className="text-xs text-muted-foreground break-all">
            https://noktanyus.com/api/health/badge
          </code>
        </div>

        <p className="mt-8 text-sm text-slate-500 dark:text-slate-400">
          RSS:{' '}
          <a href="/feeds/changelog" className="text-brand-primary hover:underline">
            Changelog feed
          </a>
          {' · '}
          <Link href="/changelog" className="text-brand-primary hover:underline">
            Changelog
          </Link>
          {' · '}
          <Link href="/baslangic" className="text-brand-primary hover:underline">
            Başlangıç
          </Link>
        </p>
      </div>
    </div>
  );
}
