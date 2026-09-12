/**
 * @file StatCard — Sayısal özet kartı için TEK kaynak.
 *
 * Daha önce `admin/newsletter` (StatCard), `saas/jobs` (StatChip) ve
 * `saas/jobs/[jobId]` (Meta) içinde üç ayrı kopya olarak duran özet kart
 * bu component'te birleştirildi.
 *
 * ÖNEMLİ — veri dürüstlüğü:
 * Bu component yalnızca kendisine verilen değeri gösterir; hiçbir metrik
 * uydurmaz. Değerin gerçek veriden gelmediği durumlar için `sample` prop'u
 * kullanılır; bu durumda kartta görünür bir "Örnek veri" işareti çıkar ve
 * ekran okuyucuya da bildirilir. Böylece gerçek metrik ile temsili metrik
 * arayüzde birbirine karışmaz.
 */

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type StatTone = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'brand';

export interface StatCardProps {
  /** Üstteki küçük etiket */
  label: ReactNode;
  /** Ana değer */
  value: ReactNode;
  /** Değer altındaki ek açıklama */
  hint?: ReactNode;
  /** Değerin renk tonu */
  tone?: StatTone;
  /** Sol üstte ikon */
  icon?: ReactNode;
  /** İçerik hizası */
  align?: 'left' | 'center';
  /**
   * `<dl>` içinde kullanılacaksa true ver — label `<dt>`, value `<dd>`
   * olarak render edilir (semantik tanım listesi).
   */
  definition?: boolean;
  /**
   * Değer gerçek veriden DEĞİL, temsili/örnek bir veriden geliyorsa true ver.
   * Kartta "Örnek veri" işareti gösterilir.
   */
  sample?: boolean;
  /** Ek className */
  className?: string;
}

const VALUE_TONE: Record<StatTone, string> = {
  default: 'text-foreground',
  success: 'text-emerald-600 dark:text-emerald-400',
  warning: 'text-amber-600 dark:text-amber-400',
  danger: 'text-rose-600 dark:text-rose-400',
  info: 'text-sky-600 dark:text-sky-400',
  brand: 'text-brand-primary',
};

export function StatCard({
  label,
  value,
  hint,
  tone = 'default',
  icon,
  align = 'left',
  definition = false,
  sample = false,
  className,
}: StatCardProps) {
  const LabelTag = definition ? 'dt' : 'p';
  const ValueTag = definition ? 'dd' : 'p';

  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-card text-card-foreground px-4 py-3 shadow-sm',
        align === 'center' && 'text-center',
        className,
      )}
    >
      <div
        className={cn(
          'flex items-center gap-2',
          align === 'center' && 'justify-center',
        )}
      >
        {icon && (
          <span aria-hidden="true" className="text-muted-foreground shrink-0">
            {icon}
          </span>
        )}
        <LabelTag className="text-xs text-muted-foreground min-w-0 truncate">
          {label}
        </LabelTag>
      </div>

      <ValueTag
        className={cn(
          'text-2xl font-bold tabular-nums mt-0.5 break-words',
          VALUE_TONE[tone],
        )}
      >
        {value}
      </ValueTag>

      {hint && (
        <p className="text-xs text-muted-foreground mt-0.5 break-words">{hint}</p>
      )}

      {sample && (
        <p className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
          <span aria-hidden="true">•</span>
          Örnek veri
        </p>
      )}
    </div>
  );
}

/**
 * StatCardGrid — özet kartları için tutarlı responsive grid.
 * Mobilde 2, sm'de 3-4 kolon.
 */
export function StatCardGrid({
  children,
  columns = 4,
  as = 'div',
  className,
}: {
  children: ReactNode;
  columns?: 2 | 3 | 4;
  /** `<dl>` semantiği gerekiyorsa 'dl' ver (StatCard definition ile birlikte) */
  as?: 'div' | 'dl';
  className?: string;
}) {
  const Tag = as;
  const cols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-2 sm:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-4',
  }[columns];

  return <Tag className={cn('grid gap-3', cols, className)}>{children}</Tag>;
}

export default StatCard;
