import type { Metadata } from 'next';
import Link from 'next/link';
import {
  CHANGELOG,
  CHANGELOG_KIND_LABEL,
  type ChangelogKind,
} from '@/lib/changelog';

export const metadata: Metadata = {
  title: 'Changelog — Noktanyus API',
  description:
    'Noktanyus API ve ürün changelog: yeni özellikler, düzeltmeler ve kırıcı değişiklikler.',
  alternates: { canonical: '/changelog' },
  openGraph: {
    title: 'Changelog — Noktanyus',
    description: 'API ve ürün güncellemeleri.',
    url: 'https://noktanyus.com/changelog',
  },
};

const KIND_STYLE: Record<ChangelogKind, string> = {
  feature: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30',
  fix: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  security: 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30',
  breaking: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
  docs: 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30',
};

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${iso}T12:00:00`));
}

export default function ChangelogPage() {
  const entries = [...CHANGELOG].sort((a, b) => (a.date < b.date ? 1 : -1));

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
          <span>Changelog</span>
        </nav>

        <header className="mb-10 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-primary">
            Developer portal
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            Changelog
          </h1>
          <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            API ve ürün değişiklikleri. Kırıcı (breaking) güncellemeler kırmızı etiketle
            işaretlenir. Entegrasyonlarınızı buna göre planlayın.
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <Link
              href="/docs"
              className="inline-flex min-h-[44px] items-center rounded-xl bg-brand-primary px-4 py-2 text-sm font-semibold text-white hover:bg-brand-primary/90"
            >
              API Docs
            </Link>
            <Link
              href="/#canli-playground"
              className="inline-flex min-h-[44px] items-center rounded-xl border border-border px-4 py-2 text-sm font-semibold text-foreground hover:border-brand-primary/40"
            >
              Canlı playground
            </Link>
            <a
              href="/changelog.xml"
              className="inline-flex min-h-[44px] items-center rounded-xl border border-border px-4 py-2 text-sm font-semibold text-foreground hover:border-brand-primary/40"
            >
              RSS abone ol
            </a>
          </div>
        </header>

        <ol className="relative border-l border-border/80 pl-6 space-y-8">
          {entries.map((entry) => (
            <li key={entry.id} className="relative">
              <span
                className="absolute -left-[1.9rem] top-1.5 h-3 w-3 rounded-full bg-brand-primary ring-4 ring-background"
                aria-hidden="true"
              />
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span
                  className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-bold uppercase ${KIND_STYLE[entry.kind]}`}
                >
                  {CHANGELOG_KIND_LABEL[entry.kind]}
                </span>
                <time dateTime={entry.date} className="text-sm text-slate-500 dark:text-slate-400">
                  {formatDate(entry.date)}
                </time>
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">
                {entry.href ? (
                  <Link href={entry.href} className="hover:text-brand-primary">
                    {entry.title}
                  </Link>
                ) : (
                  entry.title
                )}
              </h2>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{entry.summary}</p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
