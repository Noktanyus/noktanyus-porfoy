import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'API Kataloğu | Noktanyus',
  description:
    'TR yardımcı API ürün grupları: validate, finance, labor, calendar, invoice, geo, pay.',
  alternates: { canonical: '/docs/catalog' },
};

const GROUPS = [
  {
    id: 'validate',
    title: 'Doğrulama',
    href: '/docs',
    items: ['IBAN', 'TCKN/VKN', 'phone', 'plate', 'auto', 'batch', '100+ kimlik'],
  },
  {
    id: 'finance',
    title: 'Finans',
    href: '/docs',
    items: ['KDV', 'tevkifat', 'to-words', 'FX', 'creditor-ref'],
  },
  {
    id: 'labor',
    title: 'İş Kanunu',
    href: '/docs/labor',
    items: ['severance', 'overtime', 'annual-leave', 'gross-to-net', 'net-to-gross'],
  },
  {
    id: 'calendar',
    title: 'Takvim',
    href: '/docs',
    items: ['business-days', 'holidays', 'tebligat', 'BIST', 'hijri'],
  },
  {
    id: 'invoice',
    title: 'Fatura',
    href: '/docs',
    items: ['PDF', 'UBL-TR validate'],
  },
  {
    id: 'ops',
    title: 'Portal & Ops',
    href: '/dashboard',
    items: ['API keys', 'usage', 'webhooks + replay', 'monitors', 'workspaces'],
  },
];

export default function ApiCatalogPage() {
  return (
    <div className="relative bg-blob-decoration min-h-[70vh]">
      <div className="container-responsive py-10 sm:py-14 relative z-10 max-w-4xl">
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
          <span>Katalog</span>
        </nav>

        <header className="mb-8 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-primary">
            API discovery
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">API Kataloğu</h1>
          <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            Ürün gruplarına göre uç noktalar. Tam şema:{' '}
            <Link href="/openapi.json" className="text-brand-primary hover:underline">
              openapi.json
            </Link>{' '}
            ·{' '}
            <Link href="/docs" className="text-brand-primary hover:underline">
              Redoc
            </Link>
          </p>
        </header>

        <div className="grid sm:grid-cols-2 gap-4">
          {GROUPS.map((g) => (
            <Link
              key={g.id}
              href={g.href}
              className="rounded-2xl border border-border bg-card/40 p-5 hover:border-brand-primary/40 transition-colors"
            >
              <h2 className="font-bold text-lg mb-2">{g.title}</h2>
              <ul className="text-sm text-muted-foreground space-y-1">
                {g.items.map((item) => (
                  <li key={item} className="font-mono text-xs">
                    {item}
                  </li>
                ))}
              </ul>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
