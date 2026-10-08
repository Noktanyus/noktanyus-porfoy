'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FaHistory } from 'react-icons/fa';
import { readRecentTools, type RecentToolRef } from '@/lib/recentTools';

export default function RecentToolsStrip() {
  const [items, setItems] = useState<RecentToolRef[]>([]);

  useEffect(() => {
    setItems(readRecentTools());
  }, []);

  if (items.length === 0) return null;

  return (
    <section
      className="rounded-2xl border border-border/70 bg-card/50 dark:bg-slate-900/40 px-4 py-3 sm:px-5"
      aria-label="Son kullandığınız araçlar"
    >
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          <FaHistory className="h-3 w-3" aria-hidden="true" />
          Son kullanılan
        </span>
        {items.map((tool) => (
          <Link
            key={tool.slug}
            href={`/araclar/${tool.slug}`}
            className="inline-flex items-center rounded-full border border-border bg-background/70 px-3 py-1.5 text-xs sm:text-sm font-semibold text-foreground hover:border-brand-primary/40 hover:text-brand-primary transition-colors"
          >
            {tool.title}
          </Link>
        ))}
      </div>
    </section>
  );
}
