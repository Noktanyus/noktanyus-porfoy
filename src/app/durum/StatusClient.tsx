'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FaCheckCircle, FaExclamationTriangle, FaSpinner } from 'react-icons/fa';

type Component = {
  id: string;
  name: string;
  detail: string;
  href: string;
};

type HealthState = 'loading' | 'ok' | 'degraded';

export default function StatusClient({ components }: { components: Component[] }) {
  const [health, setHealth] = useState<HealthState>('loading');
  const [checkedAt, setCheckedAt] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const res = await fetch('/api/health', { cache: 'no-store' });
        if (cancelled) return;
        setHealth(res.ok ? 'ok' : 'degraded');
        setCheckedAt(new Date().toLocaleString('tr-TR'));
      } catch {
        if (!cancelled) {
          setHealth('degraded');
          setCheckedAt(new Date().toLocaleString('tr-TR'));
        }
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  const banner =
    health === 'loading'
      ? {
          cls: 'border-slate-300/60 bg-slate-100/80 dark:bg-slate-900/50 text-slate-700 dark:text-slate-200',
          icon: FaSpinner,
          spin: true,
          title: 'Sağlık kontrolü yapılıyor…',
          sub: '/api/health sorgulanıyor',
        }
      : health === 'ok'
        ? {
            cls: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200',
            icon: FaCheckCircle,
            spin: false,
            title: 'Tüm sistemler çalışıyor',
            sub: checkedAt ? `Son kontrol: ${checkedAt}` : 'Operasyonel',
          }
        : {
            cls: 'border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-200',
            icon: FaExclamationTriangle,
            spin: false,
            title: 'Bozulma algılandı',
            sub: checkedAt
              ? `Son kontrol: ${checkedAt} — sağlık uç noktası yanıt vermedi`
              : 'Sağlık uç noktası yanıt vermedi',
          };

  const Icon = banner.icon;

  return (
    <div className="space-y-6">
      <div className={`rounded-2xl border px-5 py-4 flex items-start gap-3 ${banner.cls}`}>
        <Icon
          className={`h-5 w-5 mt-0.5 shrink-0 ${banner.spin ? 'animate-spin' : ''}`}
          aria-hidden="true"
        />
        <div>
          <p className="font-bold text-lg">{banner.title}</p>
          <p className="text-sm opacity-90 mt-0.5">{banner.sub}</p>
        </div>
      </div>

      <ul className="space-y-3" aria-label="Bileşen durumu">
        {components.map((c) => (
          <li
            key={c.id}
            className="rounded-2xl border border-border/80 bg-card/50 dark:bg-slate-900/40 px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between"
          >
            <div className="min-w-0">
              <p className="font-semibold text-foreground">{c.name}</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">{c.detail}</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide ${
                  health === 'degraded' && c.id === 'api'
                    ? 'text-amber-700 dark:text-amber-300'
                    : 'text-emerald-700 dark:text-emerald-300'
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    health === 'loading'
                      ? 'bg-slate-400 animate-pulse'
                      : health === 'degraded' && c.id === 'api'
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                  }`}
                  aria-hidden="true"
                />
                {health === 'loading'
                  ? 'Kontrol'
                  : health === 'degraded' && c.id === 'api'
                    ? 'Uyarı'
                    : 'Operasyonel'}
              </span>
              <Link
                href={c.href}
                className="text-sm font-semibold text-brand-primary hover:underline min-h-[44px] inline-flex items-center"
              >
                Aç
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
