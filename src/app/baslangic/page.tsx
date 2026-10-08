import type { Metadata } from 'next';
import Link from 'next/link';
import { FaCheckCircle, FaKey, FaBolt, FaArrowRight, FaBook } from 'react-icons/fa';
import { WELCOME_CREDITS, formatWelcomeCredits } from '@/lib/apiCredits';

export const metadata: Metadata = {
  title: '5 Dakikada Başlangıç — Noktanyus API',
  description:
    'Kayıt, API anahtarı ve ilk IBAN doğrulama isteği: Noktanyus TR yardımcı API’ye 5 dakikada başlayın.',
  alternates: { canonical: '/baslangic' },
  openGraph: {
    title: '5 Dakikada Başlangıç — Noktanyus API',
    description: 'Kayıttan ilk başarılı API çağrısına adım adım.',
    url: 'https://noktanyus.com/baslangic',
  },
};

const STEPS = [
  {
    n: '01',
    title: 'Hesap oluştur',
    body: `Google veya e-posta ile kayıt ol. E-posta doğrulaması sonrası ${formatWelcomeCredits(WELCOME_CREDITS)} hediye kredi bakiyene işlenir.`,
    href: '/kayit',
    cta: 'Ücretsiz kayıt',
    icon: FaCheckCircle,
  },
  {
    n: '02',
    title: 'API anahtarı al',
    body: 'Dashboard → API Keys üzerinden nok_live_… anahtarını oluştur. Anahtarı asla istemciye gömme; sunucu tarafında sakla.',
    href: '/dashboard/api-keys',
    cta: 'API Keys',
    icon: FaKey,
  },
  {
    n: '03',
    title: 'İlk isteği at',
    body: 'IBAN doğrulama ile “hello world” yap. Kota yoksa 402 alırsın — mağazadan plan veya kredi yükle.',
    href: '/docs',
    cta: 'API Docs',
    icon: FaBolt,
  },
] as const;

export default function BaslangicPage() {
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
          <span>Başlangıç</span>
        </nav>

        <header className="mb-10 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-primary">
            Time to First Hello World
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            5 dakikada ilk API çağrısı
          </h1>
          <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
            Developer portal standardı: kayıt → anahtar → çalışan örnek. Anahtar olmadan denemek
            için ana sayfadaki canlı playground’u da kullanabilirsin.
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <Link
              href="/#canli-playground"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-semibold hover:border-brand-primary/40"
            >
              Anahtarsız dene
            </Link>
            <Link
              href="/api/feeds/changelog"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-semibold hover:border-brand-primary/40"
            >
              Changelog RSS
            </Link>
          </div>
        </header>

        <ol className="space-y-4 mb-12">
          {STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <li
                key={step.n}
                className="rounded-2xl border border-border/80 bg-card/60 dark:bg-slate-900/40 p-5 sm:p-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <span className="text-2xl font-extrabold text-brand-primary/80 tabular-nums">
                    {step.n}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
                      <Icon className="h-4 w-4 text-brand-primary shrink-0" aria-hidden="true" />
                      {step.title}
                    </h2>
                    <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                      {step.body}
                    </p>
                    <Link
                      href={step.href}
                      className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-primary hover:underline"
                    >
                      {step.cta}
                      <FaArrowRight className="h-3 w-3" aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>

        <section className="rounded-2xl border border-sky-500/25 bg-sky-500/5 p-6 sm:p-8">
          <div className="flex items-start gap-3">
            <FaBook className="h-5 w-5 text-sky-500 mt-0.5 shrink-0" aria-hidden="true" />
            <div>
              <h2 className="text-lg font-bold text-foreground">Örnek cURL</h2>
              <pre className="mt-3 overflow-x-auto rounded-xl border border-border bg-slate-950 text-slate-200 p-4 text-xs sm:text-sm leading-relaxed">
{`curl -X POST https://noktanyus.com/api/v1/validate/iban \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -d '{"iban":"TR330006100519786457841326"}'`}
              </pre>
              <Link
                href="/docs"
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-primary hover:underline"
              >
                Tüm uçlar için Redoc
                <FaArrowRight className="h-3 w-3" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
