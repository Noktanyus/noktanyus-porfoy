/**
 * @file /docs — TR yardımcı API dokümantasyonu (Redoc + Try-it örnekleri)
 */

import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import Link from 'next/link';

const RedocMount = dynamic(() => import('@/components/docs/RedocMount'), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[400px] items-center justify-center rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
        <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-blue-500" />
        API referansı yükleniyor…
      </div>
    </div>
  ),
});

export const metadata: Metadata = {
  title: 'TR API Referansı — Noktanyus',
  description:
    'TR yardımcı API: doğrulama, finans, takvim, coğrafya. x-api-key ile çağırın; abonelik kotası veya ön ödemeli kredi.',
  keywords: ['TR API', 'OpenAPI', 'IBAN', 'VKN', 'PayTR', 'API key', 'Redoc'],
  robots: { index: true, follow: true },
  alternates: { canonical: '/docs' },
  openGraph: {
    title: 'TR API Referansı — Noktanyus',
    description: 'Validate · finance · calendar · geo — x-api-key ile.',
    type: 'website',
  },
};

const CODE_SAMPLES = [
  {
    id: 'curl',
    label: 'cURL',
    endpoint: 'POST /api/v1/validate/iban',
    code: `curl -X POST https://noktanyus.com/api/v1/validate/iban \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -d '{"iban":"TR330006100519786457841326"}'`,
  },
  {
    id: 'js',
    label: 'JavaScript',
    endpoint: 'POST /api/v1/validate/iban',
    code: `const res = await fetch('https://noktanyus.com/api/v1/validate/iban', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': process.env.NOKTANYUS_API_KEY,
  },
  body: JSON.stringify({ iban: 'TR330006100519786457841326' }),
});
const { success, data } = await res.json();`,
  },
  {
    id: 'py',
    label: 'Python',
    endpoint: 'POST /api/v1/validate/iban',
    code: `import os, requests

resp = requests.post(
    'https://noktanyus.com/api/v1/validate/iban',
    headers={'x-api-key': os.environ['NOKTANYUS_API_KEY']},
    json={'iban': 'TR330006100519786457841326'},
    timeout=10,
)
resp.raise_for_status()
print(resp.json())`,
  },
];

export default function DocsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
      <section className="border-b border-slate-200 bg-white/60 backdrop-blur dark:border-slate-800 dark:bg-slate-950/60">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <Link href="/" className="hover:text-slate-900 dark:hover:text-slate-100">
                Ana sayfa
              </Link>
              <span aria-hidden="true">/</span>
              <span>Dokümantasyon</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-4xl">
              TR yardımcı API
            </h1>
            <p className="mt-2 max-w-2xl text-base text-slate-600 dark:text-slate-400">
              Doğrulama, finans, takvim ve coğrafya uçları. Kimlik:{' '}
              <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs dark:bg-slate-800">
                x-api-key
              </code>
              . Kota abonelikten veya ön ödemeli krediden düşer.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
              <Link
                href="/dashboard/api-keys"
                className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-1.5 font-medium text-white shadow-sm transition hover:bg-blue-700"
              >
                API anahtarı oluştur
              </Link>
              <Link
                href="/magaza/abonelikler"
                className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-700 shadow-sm transition hover:border-blue-500 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
              >
                Aylık planlar
              </Link>
              <Link
                href="/magaza/krediler"
                className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-700 shadow-sm transition hover:border-blue-500 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
              >
                Kredi yükle
              </Link>
              <a
                href="/api/openapi"
                className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-700 shadow-sm transition hover:border-blue-500 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                target="_blank"
                rel="noopener noreferrer"
              >
                openapi.json
              </a>
              <a
                href="#quick-start"
                className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-700 shadow-sm transition hover:border-blue-500 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
              >
                Try it
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="quick-start" className="border-b border-slate-200 dark:border-slate-800">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
            Try it — IBAN doğrula
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-600 dark:text-slate-400">
            Aşağıdaki örnekleri kopyalayıp kendi anahtarınızla çalıştırın. Header:{' '}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs dark:bg-slate-800">
              x-api-key
            </code>
            . Kota yoksa yanıt{' '}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs dark:bg-slate-800">
              402
            </code>{' '}
            olur.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
            {CODE_SAMPLES.map((sample) => (
              <div
                key={sample.id}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950"
              >
                <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2 dark:border-slate-800 dark:bg-slate-900">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {sample.label}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">
                    {sample.endpoint}
                  </span>
                </div>
                <pre className="overflow-x-auto p-4 text-xs leading-relaxed text-slate-800 dark:text-slate-200">
                  <code>{sample.code}</code>
                </pre>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 dark:border-slate-800">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
            Kimlik doğrulama
          </h2>
          <ol className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-4">
            {[
              {
                n: 1,
                title: 'Anahtar al',
                desc: '/dashboard/api-keys üzerinden bir anahtar oluşturun.',
              },
              {
                n: 2,
                title: 'Plan veya kredi',
                desc: 'Aylık kota için abonelik; kullandığın kadar için kredi yükle.',
              },
              {
                n: 3,
                title: 'Header gönder',
                desc: 'Her istekte x-api-key: <anahtar> ekleyin.',
              },
              {
                n: 4,
                title: 'Çağır',
                desc: 'POST /api/v1/validate/*, finance, calendar, geo…',
              },
            ].map((step) => (
              <li
                key={step.n}
                className="relative rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950"
              >
                <span className="absolute -top-3 left-4 inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                  {step.n}
                </span>
                <h3 className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-50">
                  {step.title}
                </h3>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{step.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
            Endpoint referansı
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Spec: OpenAPI 3.1.0 · etiket: TR API
          </span>
        </div>
        <RedocMount />
      </section>
    </main>
  );
}
