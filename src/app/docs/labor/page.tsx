import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'İş Kanunu API — Kıdem, Mesai, Bordro | Noktanyus',
  description:
    'Kıdem/ihbar, fazla mesai, yıllık izin, brüt↔net maaş uçları. Hukuki tavsiye değildir; formül tabanlı yardımcı API.',
  alternates: { canonical: '/docs/labor' },
};

const ENDPOINTS = [
  {
    path: 'POST /api/v1/labor/severance',
    title: 'Kıdem + ihbar',
    body: '{ monthlyGrossCents, startDate, endDate, severanceCeilingCents? }',
  },
  {
    path: 'POST /api/v1/labor/overtime',
    title: 'Fazla çalışma',
    body: '{ monthlyGrossCents, hours, kind?: overtime|excess|holiday }',
  },
  {
    path: 'POST /api/v1/labor/annual-leave',
    title: 'Yıllık izin hakkı',
    body: '{ startDate, asOfDate?, ageYears? }',
  },
  {
    path: 'POST /api/v1/labor/gross-to-net',
    title: 'Brüt → net',
    body: '{ monthlyGrossCents, monthIndex?, sgkCeilingCents?, includeStampTax? }',
  },
  {
    path: 'POST /api/v1/labor/net-to-gross',
    title: 'Net → brüt',
    body: '{ monthlyNetCents, monthIndex?, sgkCeilingCents?, includeStampTax? }',
  },
];

export default function LaborDocsPage() {
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
          <span>Labor</span>
        </nav>

        <header className="mb-8 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-primary">
            4857 yardımcı API
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">İş Kanunu & Bordro</h1>
          <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            Scope: <code className="text-xs">api:labor:*</code>. Ücretsiz tarayıcı araçları:{' '}
            <Link href="/araclar/brut-net-maas" className="text-brand-primary hover:underline">
              brüt/net
            </Link>
            ,{' '}
            <Link href="/araclar/fazla-mesai-izin" className="text-brand-primary hover:underline">
              fazla mesai / izin
            </Link>
            .
          </p>
        </header>

        <ul className="space-y-3 mb-10">
          {ENDPOINTS.map((ep) => (
            <li key={ep.path} className="rounded-2xl border border-border bg-card/40 p-4">
              <p className="font-bold text-sm">{ep.title}</p>
              <code className="text-xs font-mono text-brand-primary block mt-1">{ep.path}</code>
              <p className="text-xs text-muted-foreground mt-2 font-mono">{ep.body}</p>
            </li>
          ))}
        </ul>

        <p className="text-sm text-slate-500">
          OpenAPI:{' '}
          <Link href="/api/openapi" className="text-brand-primary hover:underline">
            /api/openapi
          </Link>{' '}
          · SDK: <code className="text-xs">calculateOvertime</code>,{' '}
          <code className="text-xs">calculateGrossToNet</code>, …
        </p>
      </div>
    </div>
  );
}
