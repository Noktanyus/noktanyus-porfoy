import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'API hata kodları — Noktanyus',
  description:
    'Noktanyus API HTTP durumları, makine okunabilir error.code değerleri, retry önerileri ve sonraki adımlar.',
  alternates: { canonical: '/docs/hatalar' },
  openGraph: {
    title: 'API hata kodları — Noktanyus',
    description: 'VALIDASYON, kota, rate limit ve auth hata sözleşmesi.',
    url: 'https://noktanyus.com/docs/hatalar',
  },
};

type ErrorRow = {
  http: number;
  code: string;
  title: string;
  retryable: boolean;
  action: string;
  example: string;
};

const ERRORS: ErrorRow[] = [
  {
    http: 400,
    code: 'VALIDATION',
    title: 'Doğrulama hatası',
    retryable: false,
    action: 'İstek gövdesini OpenAPI şemasına göre düzelt; fieldErrors alanlarını oku.',
    example: `{"success":false,"error":{"code":"VALIDATION","message":{"fieldErrors":{"iban":["Zorunlu"]}}}}`,
  },
  {
    http: 401,
    code: 'UNAUTHORIZED',
    title: 'Anahtar yok / geçersiz',
    retryable: false,
    action: 'Authorization: Bearer nok_live_… veya x-api-key başlığını ekle; Dashboard → API Keys.',
    example: `{"success":false,"error":{"code":"UNAUTHORIZED","message":"API key required…"}}`,
  },
  {
    http: 401,
    code: 'INVALID_KEY',
    title: 'Anahtar reddedildi',
    retryable: false,
    action: 'Anahtarın iptal/süresi dolmuş olabilir; yeni anahtar oluştur.',
    example: `{"success":false,"error":{"code":"INVALID_KEY","message":"Invalid API key"}}`,
  },
  {
    http: 402,
    code: 'QUOTA_EXCEEDED',
    title: 'Kota veya kredi bitti',
    retryable: false,
    action: 'Plan yükselt veya /magaza/krediler üzerinden kredi yükle; sonra isteği tekrarla.',
    example: `{"success":false,"error":{"code":"QUOTA_EXCEEDED","message":"Aylık istek kotanız dolmuştur…"}}`,
  },
  {
    http: 429,
    code: 'RATE_LIMITED',
    title: 'Hız sınırı',
    retryable: true,
    action:
      'Retry-After (sn) kadar bekle; exponential backoff uygula. X-RateLimit-Remaining / X-RateLimit-Reset başlıklarını izle; X-Request-Id ile destek talebi aç.',
    example: `{"success":false,"error":{"code":"RATE_LIMITED","message":"Too many requests"}}`,
  },
  {
    http: 500,
    code: 'INTERNAL_ERROR',
    title: 'Sunucu hatası',
    retryable: true,
    action:
      'Kısa backoff ile 1–2 kez dene; sürerse /durum ve destek kanalını kontrol et. Yanıttaki X-Request-Id değerini ilet.',
    example: `{"success":false,"error":{"code":"INTERNAL_ERROR","message":"Unexpected error"}}`,
  },
];

export default function ApiErrorsPage() {
  return (
    <div className="relative bg-blob-decoration min-h-[70vh]">
      <div className="container-responsive py-10 sm:py-14 relative z-10 max-w-4xl">
        <nav className="text-sm text-slate-500 dark:text-slate-400 mb-6" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-brand-primary">
            Ana sayfa
          </Link>
          <span aria-hidden="true" className="mx-2">
            /
          </span>
          <Link href="/docs" className="hover:text-brand-primary">
            Docs
          </Link>
          <span aria-hidden="true" className="mx-2">
            /
          </span>
          <span>Hata kodları</span>
        </nav>

        <header className="mb-10 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-primary">
            Error contract
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            API hata kodları
          </h1>
          <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
            Her hata için sabit <code className="text-sm">error.code</code>, HTTP durumu, retry
            uygunluğu ve ne yapman gerektiği. Agent / SDK entegrasyonlarında mesaj metnine değil
            koda güven.
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <Link
              href="/docs"
              className="inline-flex min-h-[44px] items-center rounded-xl bg-brand-primary px-4 py-2 text-sm font-semibold text-white hover:bg-brand-primary/90"
            >
              OpenAPI Docs
            </Link>
            <Link
              href="/baslangic"
              className="inline-flex min-h-[44px] items-center rounded-xl border border-border px-4 py-2 text-sm font-semibold hover:border-brand-primary/40"
            >
              Başlangıç
            </Link>
            <Link
              href="/durum"
              className="inline-flex min-h-[44px] items-center rounded-xl border border-border px-4 py-2 text-sm font-semibold hover:border-brand-primary/40"
            >
              Sistem durumu
            </Link>
          </div>
        </header>

        <div className="rounded-2xl border border-border/80 bg-card/40 dark:bg-slate-900/40 p-4 sm:p-5 mb-8 text-sm text-slate-600 dark:text-slate-300 space-y-3">
          <div>
            <p className="font-semibold text-foreground mb-1">Ortak zarf</p>
            <pre className="overflow-x-auto font-mono text-xs sm:text-sm text-slate-700 dark:text-slate-200">{`{ "success": false, "error": { "code": "…", "message": "…" } }`}</pre>
          </div>
          <p>
            Kimlik doğrulamalı TR API yanıtlarında{' '}
            <code className="text-xs">X-Request-Id</code> her zaman döner; destek
            korelasyonu için saklayın. Limit durumu için{' '}
            <Link href="/docs/rate-limits" className="text-brand-primary hover:underline">
              /docs/rate-limits
            </Link>
            .
          </p>
        </div>

        <ul className="space-y-4">
          {ERRORS.map((row) => (
            <li
              key={`${row.http}-${row.code}`}
              id={row.code.toLowerCase()}
              className="rounded-2xl border border-border/80 bg-card/50 dark:bg-slate-900/40 p-5 sm:p-6"
            >
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="inline-flex rounded-lg bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 px-2.5 py-1 text-xs font-bold font-mono">
                  HTTP {row.http}
                </span>
                <span className="inline-flex rounded-lg border border-brand-primary/40 bg-brand-primary/10 px-2.5 py-1 text-xs font-bold font-mono text-brand-primary">
                  {row.code}
                </span>
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold uppercase ${
                    row.retryable
                      ? 'bg-amber-500/15 text-amber-800 dark:text-amber-200'
                      : 'bg-slate-500/15 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {row.retryable ? 'Retryable' : 'Fix request'}
                </span>
              </div>
              <h2 className="text-lg font-bold text-foreground mb-2">{row.title}</h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                {row.action}
              </p>
              <pre className="overflow-x-auto rounded-xl bg-slate-950 text-slate-200 p-3 text-[11px] sm:text-xs font-mono leading-relaxed">
                {row.example}
              </pre>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
