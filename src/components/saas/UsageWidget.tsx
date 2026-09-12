'use client';

/**
 * @file UsageWidget — Kullanıcının aylık AI kota kullanımını gösteren widget.
 * @description Client component; fetch sonrası gelen usage verisini görsel bar +
 *              sayılarla sunar. Plan değişikliği / limit aşımı durumlarında renkli
 *              uyarı verir (yeşil < %70, sarı < %90, kırmızı >= %90).
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { ErrorDisplay } from '@/components/ui/ErrorDisplay';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { StatusBadge } from '@/components/ui/StatusBadge';

export interface UsageWidgetData {
  planSlug: string | null;
  isUnlimited?: boolean;
  month: string;
  tokensUsed: number;
  requestsUsed: number;
  tokensLimit: number | null;
  requestsLimit: number | null;
  tokensRemaining: number | null;
  requestsRemaining: number | null;
}

interface UsageWidgetProps {
  /** İlk server-rendered data. Belirtilirse ilk paint için kullanılır, sonra /api/user/ai/usage ile refresh yapılır. */
  initialData?: UsageWidgetData | null;
  /** Compact görünüm (dashboard kartı için). */
  compact?: boolean;
}

export function UsageWidget({ initialData, compact = false }: UsageWidgetProps) {
  const [data, setData] = useState<UsageWidgetData | null>(initialData ?? null);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/user/ai/usage', { credentials: 'include' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as { success: boolean; data?: UsageWidgetData };
        if (!cancelled) setData(json.data ?? null);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Yüklenemedi');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [initialData]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6">
        <LoadingSkeleton variant="text-line" count={3} loadingLabel="AI kullanımı yükleniyor" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <ErrorDisplay
        variant="card"
        title="Kullanım bilgisi yüklenemedi"
        message={
          error
            ? `Aylık AI kullanımınız şu an getirilemedi (${error}). Üretim ekranları çalışmaya devam eder.`
            : 'Aylık AI kullanımınız şu an getirilemedi. Üretim ekranları çalışmaya devam eder.'
        }
        showHomeLink={false}
        className="p-6"
      />
    );
  }

  const planLabel = data.planSlug ? data.planSlug.toUpperCase() : 'PLAN YOK';
  const isUnlimited = data.isUnlimited ?? data.tokensLimit === null;

  const tokenPct = !isUnlimited && data.tokensLimit
    ? Math.min(100, (data.tokensUsed / data.tokensLimit) * 100)
    : 0;
  const reqPct = !isUnlimited && data.requestsLimit
    ? Math.min(100, (data.requestsUsed / data.requestsLimit) * 100)
    : 0;

  return (
    <div className={cn('rounded-2xl border border-border bg-card p-6', compact && 'p-4')}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {data.month}
          </p>
          <h3 className="text-lg font-bold text-foreground">
            AI Kullanımı
          </h3>
        </div>
        <StatusBadge tone="brand" label={planLabel} srLabel="Mevcut plan:" />
      </div>

      {isUnlimited ? (
        <div className="text-center py-4">
          <p className="text-3xl font-bold text-brand-primary tabular-nums">
            {data.tokensUsed.toLocaleString('tr-TR')}
          </p>
          <p className="text-sm text-muted-foreground mt-1">token · sınırsız plan</p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Token bar */}
          <div>
            <div className="flex justify-between text-sm mb-1.5">
              <span className="font-medium text-foreground">Token</span>
              <span className="tabular-nums text-muted-foreground">
                {data.tokensUsed.toLocaleString('tr-TR')}
                {data.tokensLimit !== null && (
                  <> / {data.tokensLimit.toLocaleString('tr-TR')}</>
                )}
              </span>
            </div>
            <ProgressBar
              value={tokenPct}
              tone="auto"
              label="Aylık token kullanımı"
            />
            {data.tokensRemaining !== null && (
              <p className="text-xs text-muted-foreground mt-1 tabular-nums">
                {data.tokensRemaining.toLocaleString('tr-TR')} token kaldı
              </p>
            )}
          </div>

          {/* Request bar */}
          {data.requestsLimit !== null && (
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="font-medium text-foreground">İstek</span>
                <span className="tabular-nums text-muted-foreground">
                  {data.requestsUsed} / {data.requestsLimit}
                </span>
              </div>
              <ProgressBar
                value={reqPct}
                tone="auto"
                label="Aylık istek kullanımı"
              />
              {data.requestsRemaining !== null && (
                <p className="text-xs text-muted-foreground mt-1 tabular-nums">
                  {data.requestsRemaining} istek kaldı
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {!isUnlimited && (tokenPct >= 90 || reqPct >= 90) && (
        <div
          role="status"
          className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-sm"
        >
          <p className="text-amber-800 dark:text-amber-200 font-medium mb-1">
            Limitinize yaklaşıyorsunuz
          </p>
          <Link
            href="/saas/dashboard#upgrade"
            className="text-amber-700 dark:text-amber-300 underline underline-offset-2 hover:text-amber-900 dark:hover:text-amber-100"
          >
            Planı yükseltin →
          </Link>
        </div>
      )}
    </div>
  );
}
