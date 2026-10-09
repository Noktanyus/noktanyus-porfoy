import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Rate limits & kota — Noktanyus API',
  description:
    'Dakikalık rate limit, aylık kota, Retry-After ve X-RateLimit başlıkları; 429 / 402 yanıtları.',
  alternates: { canonical: '/docs/rate-limits' },
};

const HEADERS = [
  {
    name: 'X-RateLimit-Limit',
    meaning: 'Dakika başına izin verilen maksimum istek (anahtar rateLimit).',
  },
  {
    name: 'X-RateLimit-Remaining',
    meaning: 'Pencerede kalan istek hakkı.',
  },
  {
    name: 'Retry-After',
    meaning: '429 sonrası kaç saniye beklenmeli (saniye cinsinden).',
  },
];

export default function RateLimitsPage() {
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
          <span>Rate limits</span>
        </nav>

        <header className="mb-8 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-primary">
            Quotas
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Rate limit ve kota
          </h1>
          <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            Her API anahtarının dakikalık limiti ve (plan/krediye bağlı) aylık kotası vardır. Limit
            aşımında sabit <code className="text-sm">error.code</code> döner — mesaja değil koda bak.
          </p>
        </header>

        <section className="mb-8 space-y-3">
          <h2 className="text-lg font-bold">HTTP durumları</h2>
          <ul className="space-y-3 text-sm">
            <li className="rounded-2xl border border-border/80 bg-card/50 p-4">
              <p className="font-bold font-mono">429 · RATE_LIMITED</p>
              <p className="text-slate-600 dark:text-slate-300 mt-1">
                Dakika penceresi doldu. <code>Retry-After</code> kadar bekle; exponential backoff uygula.
              </p>
            </li>
            <li className="rounded-2xl border border-border/80 bg-card/50 p-4">
              <p className="font-bold font-mono">402 · QUOTA_EXCEEDED</p>
              <p className="text-slate-600 dark:text-slate-300 mt-1">
                Aylık plan kotası veya kredi bitti.{' '}
                <Link href="/magaza/abonelikler" className="text-brand-primary hover:underline">
                  Plan yükselt
                </Link>{' '}
                veya{' '}
                <Link href="/magaza/krediler" className="text-brand-primary hover:underline">
                  kredi yükle
                </Link>
                .
              </p>
            </li>
          </ul>
        </section>

        <section className="mb-8 space-y-3">
          <h2 className="text-lg font-bold">Yanıt başlıkları</h2>
          <ul className="space-y-2">
            {HEADERS.map((h) => (
              <li
                key={h.name}
                className="rounded-xl border border-border/70 px-4 py-3 text-sm"
              >
                <code className="font-mono text-xs sm:text-sm font-bold text-brand-primary">
                  {h.name}
                </code>
                <p className="mt-1 text-slate-600 dark:text-slate-300">{h.meaning}</p>
              </li>
            ))}
          </ul>
        </section>

        <p className="text-sm text-slate-500">
          Tam hata sözleşmesi:{' '}
          <Link href="/docs/hatalar" className="text-brand-primary hover:underline">
            /docs/hatalar
          </Link>
          {' · '}
          Canlı kullanım:{' '}
          <Link href="/dashboard/usage" className="text-brand-primary hover:underline">
            /dashboard/usage
          </Link>
        </p>
      </div>
    </div>
  );
}
