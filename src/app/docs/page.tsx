/**
 * @file /docs — Public API Documentation (Redoc embed)
 * @description Auth gerektirmeyen public API reference. Redoc standalone bundle
 *              CDN'den yüklenir — npm install redoc gerektirmez (Redoc bir
 *              Node.js CLI/SSR tool, Next.js browser bundle'ında gereksiz
 *              dependency yükü yaratır).
 *
 *              Layout: hero + sidebar navigation + Redoc mount + try-it
 *              code samples (curl + JavaScript fetch + Python requests).
 *
 *              Phase D.4 — public API docs (login gerekli değil).
 */

import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import Link from 'next/link';

// Client-side Redoc mount — SSR sırasında çalışmaz (Redoc browser bundle'ı).
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
  title: 'API Referansı — Noktanyus',
  description:
    'Noktanyus Portfolio & SaaS platformunun public REST API referansı. Auth, OAuth 2.0, AI generation, ürün kataloğu, blog CMS ve API key yönetimi.',
  keywords: ['API', 'OpenAPI', 'Redoc', 'OAuth 2.0', 'REST', 'SaaS'],
  robots: { index: true, follow: true },
  alternates: { canonical: '/docs' },
  openGraph: {
    title: 'API Referansı — Noktanyus',
    description: 'Public REST API + OAuth 2.0 PKCE akışı için tam referans.',
    type: 'website',
  },
};

const CODE_SAMPLES = [
  {
    id: 'curl',
    label: 'cURL',
    code: `curl -X POST https://api.noktanyus.local/api/auth/oauth/token \\
  -H "Content-Type: application/json" \\
  -d '{
    "grant_type": "authorization_code",
    "code": "AUTHORIZATION_CODE",
    "redirect_uri": "https://yourapp.com/callback",
    "client_id": "YOUR_CLIENT_ID",
    "code_verifier": "PKCE_VERIFIER"
  }'`,
  },
  {
    id: 'js',
    label: 'JavaScript',
    code: `const res = await fetch('https://api.noktanyus.local/api/auth/oauth/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    grant_type: 'authorization_code',
    code,
    redirect_uri: 'https://yourapp.com/callback',
    client_id: process.env.NOKTANYUS_CLIENT_ID,
    code_verifier: verifier,
  }),
});
const { access_token, refresh_token, expires_in } = await res.json();`,
  },
  {
    id: 'py',
    label: 'Python',
    code: `import requests

resp = requests.post(
    'https://api.noktanyus.local/api/auth/oauth/token',
    json={
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': 'https://yourapp.com/callback',
        'client_id': CLIENT_ID,
        'code_verifier': verifier,
    },
    timeout=10,
)
resp.raise_for_status()
tokens = resp.json()
# tokens["access_token"], tokens["refresh_token"], tokens["expires_in"]`,
  },
];

export default function DocsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
      {/* ───────────── Hero ───────────── */}
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
              API Referansı
            </h1>
            <p className="mt-2 max-w-2xl text-base text-slate-600 dark:text-slate-400">
              Noktanyus SaaS platformunun public REST API yüzeyi. OAuth 2.0 PKCE akışı, AI üretimi,
              ürün kataloğu ve API key yönetimi için tam referans. Tüm endpointler OpenAPI 3.1.0
              standardında tanımlıdır.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
              <a
                href="/api/openapi"
                className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-700 shadow-sm transition hover:border-blue-500 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-blue-400 dark:hover:text-blue-300"
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <path d="M14 2v6h6" />
                  <path d="M9 13h6M9 17h6" />
                </svg>
                <span>openapi.json indir</span>
              </a>
              <a
                href="#oauth-flow"
                className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-700 shadow-sm transition hover:border-blue-500 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-blue-400 dark:hover:text-blue-300"
              >
                OAuth 2.0 PKCE akışı
              </a>
              <a
                href="#quick-start"
                className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-700 shadow-sm transition hover:border-blue-500 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-blue-400 dark:hover:text-blue-300"
              >
                Hızlı başlangıç
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────── Quick start ───────────── */}
      <section
        id="quick-start"
        className="border-b border-slate-200 dark:border-slate-800"
      >
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
            Hızlı başlangıç
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-600 dark:text-slate-400">
            Üç farklı dilde OAuth 2.0 Authorization Code + PKCE akışının ilk adımı:
            <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs dark:bg-slate-800">/api/auth/oauth/token</code>
            . Tüm istekler için base URL: <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs dark:bg-slate-800">/api</code>.
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
                    POST /api/auth/oauth/token
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

      {/* ───────────── OAuth flow diagram ───────────── */}
      <section
        id="oauth-flow"
        className="border-b border-slate-200 dark:border-slate-800"
      >
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
            OAuth 2.0 + PKCE akışı
          </h2>
          <ol className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-4">
            {[
              {
                n: 1,
                title: 'Authorize',
                desc: 'Kullanıcı /api/auth/oauth/authorize\'a yönlendirilir (response_type=code, code_challenge=S256).',
              },
              {
                n: 2,
                title: 'Consent',
                desc: 'Login sonrası /auth/oauth/consent ekranı scopes için onay alır.',
              },
              {
                n: 3,
                title: 'Code → Token',
                desc: 'redirect_uri\'ye dönen code + code_verifier ile /api/auth/oauth/token\'a POST.',
              },
              {
                n: 4,
                title: 'API call',
                desc: 'access_token (1h TTL) Bearer header\'da; refresh_token (30g) ile yenilenir.',
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

      {/* ───────────── Redoc mount ───────────── */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
            Endpoint referansı
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Spec: OpenAPI 3.1.0
          </span>
        </div>
        <RedocMount />
      </section>
    </main>
  );
}