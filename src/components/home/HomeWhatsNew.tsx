import Link from 'next/link';
import { FaArrowRight } from 'react-icons/fa';
import {
  CHANGELOG_KIND_LABEL,
  getRecentChangelog,
  type ChangelogKind,
} from '@/lib/changelog';

const KIND_STYLE: Record<ChangelogKind, string> = {
  feature: 'bg-sky-500/15 text-sky-600 dark:text-sky-300 border-sky-500/25',
  fix: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/25',
  security: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/25',
  breaking: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/25',
  docs: 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/25',
};

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(`${iso}T12:00:00`));
  } catch {
    return iso;
  }
}

export default function HomeWhatsNew() {
  const entries = getRecentChangelog(4);

  return (
    <section className="py-6 sm:py-8" aria-labelledby="whats-new-title">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-primary mb-2">
            Changelog
          </p>
          <h2
            id="whats-new-title"
            className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight"
          >
            Yenilikler
          </h2>
          <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-xl">
            API ve ürün güncellemeleri — breaking change’ler burada işaretlenir.
          </p>
        </div>
        <Link
          href="/changelog"
          className="inline-flex items-center gap-2 text-sm font-semibold text-brand-primary hover:underline"
        >
          Tüm changelog
          <FaArrowRight className="h-3 w-3" aria-hidden="true" />
        </Link>
      </div>

      <ol className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        {entries.map((entry) => (
          <li key={entry.id}>
            <article className="h-full rounded-2xl border border-border/80 bg-card/60 dark:bg-slate-900/40 p-5 backdrop-blur-sm transition hover:border-brand-primary/35">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span
                  className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${KIND_STYLE[entry.kind]}`}
                >
                  {CHANGELOG_KIND_LABEL[entry.kind]}
                </span>
                <time
                  dateTime={entry.date}
                  className="text-xs text-slate-500 dark:text-slate-400"
                >
                  {formatDate(entry.date)}
                </time>
              </div>
              <h3 className="text-base font-bold text-foreground mb-1.5">
                {entry.href ? (
                  <Link href={entry.href} className="hover:text-brand-primary transition-colors">
                    {entry.title}
                  </Link>
                ) : (
                  entry.title
                )}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {entry.summary}
              </p>
            </article>
          </li>
        ))}
      </ol>
    </section>
  );
}
