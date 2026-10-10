import type { Metadata } from 'next';
import Link from 'next/link';
import StatusClient from './StatusClient';
import { StatusSubscribeForm } from '@/components/status/StatusSubscribeForm';
import {
  publicStatusEndpoints,
  statusBadgeMarkdown,
} from '@/lib/statusSubscribe';

export const metadata: Metadata = {
  title: 'Sistem durumu — Noktanyus',
  description:
    'Noktanyus API, docs ve araçların operasyonel durumu. Anlık sağlık kontrolü ve kesinti e-posta aboneliği.',
  alternates: { canonical: '/durum' },
  openGraph: {
    title: 'Sistem durumu — Noktanyus',
    description: 'API ve site sağlık durumu; kesinti bildirimi abonesi olun.',
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

const ENDPOINTS = publicStatusEndpoints();
const BADGE_MD = statusBadgeMarkdown();

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
            Kesinti duyurusu varsa burada görünür; e-posta ile de takip edebilirsiniz.
          </p>
        </header>

        <StatusClient components={[...COMPONENTS]} />

        <div className="mt-8">
          <StatusSubscribeForm />
        </div>

        <section
          aria-labelledby="status-embed-heading"
          className="mt-8 rounded-2xl border border-border bg-card/40 px-5 py-5 space-y-4"
        >
          <h2
            id="status-embed-heading"
            className="text-base font-bold text-foreground"
          >
            Durum rozeti ve JSON
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            README veya dokümantasyona gömülebilir SVG rozet; makine-okunur özet için
            JSON sağlık uç noktası.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/api/health/badge"
              alt="Noktanyus durum rozeti"
              width={140}
              height={20}
              className="h-5 w-auto"
            />
            <code className="text-xs text-muted-foreground break-all">
              {ENDPOINTS.badgeSvg}
            </code>
          </div>

          <dl className="space-y-3 text-sm">
            <div>
              <dt className="font-semibold text-foreground">SVG rozet</dt>
              <dd>
                <a
                  href={ENDPOINTS.badgeSvg}
                  className="font-mono text-xs text-brand-primary hover:underline break-all"
                >
                  GET {ENDPOINTS.badgeSvg}
                </a>
                <span className="text-muted-foreground"> — image/svg+xml</span>
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-foreground">JSON sağlık</dt>
              <dd>
                <a
                  href={ENDPOINTS.healthJson}
                  className="font-mono text-xs text-brand-primary hover:underline break-all"
                >
                  GET {ENDPOINTS.healthJson}
                </a>
                <span className="text-muted-foreground">
                  {' '}
                  — {'{ status, checks, timestamp }'}
                </span>
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-foreground">Markdown gömme</dt>
              <dd>
                <code className="block mt-1 text-xs bg-muted/40 rounded-lg px-3 py-2 break-all text-muted-foreground">
                  {BADGE_MD}
                </code>
              </dd>
            </div>
          </dl>
        </section>

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
