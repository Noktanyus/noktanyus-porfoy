/**
 * @file ProgressBar — İlerleme çubuğu için TEK kaynak.
 *
 * `UsageWidget`, `saas/jobs` listesi ve `saas/jobs/[jobId]` detayında üç ayrı
 * kopya olarak duran progress bar blokları burada birleştirildi.
 *
 * a11y:
 * - `role="progressbar"` + aria-valuenow/min/max
 * - `label` zorunlu → aria-label olarak bağlanır
 * - Yüzde metni ayrıca görünür gösterilebilir (`showValue`), böylece bilgi
 *   yalnız renkle aktarılmaz (WCAG 1.4.1)
 * - prefers-reduced-motion: transition sınıfı motion-safe ile koşullanır
 */

import { cn } from '@/lib/utils';

export type ProgressTone = 'brand' | 'success' | 'warning' | 'danger' | 'auto';

export interface ProgressBarProps {
  /** 0-100 arası yüzde. Aralık dışı değerler kırpılır. */
  value: number;
  /** Ekran okuyucu etiketi (zorunlu) */
  label: string;
  /** Renk tonu. 'auto' → %90+ kırmızı, %70+ amber, altı yeşil. */
  tone?: ProgressTone;
  /** Çubuk kalınlığı */
  size?: 'sm' | 'md' | 'lg';
  /** Yüzdeyi çubuğun sağında metin olarak göster */
  showValue?: boolean;
  /** Ek className (wrapper) */
  className?: string;
}

const SIZE_CLASSES = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-3',
} as const;

const TONE_CLASSES: Record<Exclude<ProgressTone, 'auto'>, string> = {
  brand: 'bg-brand-primary',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-rose-500',
};

/** 'auto' tonu için yüzdeye göre renk seçimi. */
function autoTone(pct: number): Exclude<ProgressTone, 'auto'> {
  if (pct >= 90) return 'danger';
  if (pct >= 70) return 'warning';
  return 'success';
}

/**
 * Yüzdeyi 0-100 aralığına sıkıştırır.
 *
 * - `NaN` → 0 (hesaplanamayan oran; `width: NaN%` üretmesini engeller)
 * - `+Infinity` → 100 (limitin üstü = dolu)
 * - `-Infinity` → 0
 */
export function clampPercent(value: number): number {
  if (Number.isNaN(value)) return 0;
  if (value === Number.POSITIVE_INFINITY) return 100;
  if (value === Number.NEGATIVE_INFINITY) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}

export function ProgressBar({
  value,
  label,
  tone = 'brand',
  size = 'md',
  showValue = false,
  className,
}: ProgressBarProps) {
  const pct = clampPercent(value);
  const resolvedTone = tone === 'auto' ? autoTone(pct) : tone;

  const track = (
    <div
      className={cn(
        'flex-1 rounded-full bg-muted overflow-hidden',
        SIZE_CLASSES[size],
      )}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div
        className={cn('h-full motion-safe:transition-all', TONE_CLASSES[resolvedTone])}
        style={{ width: `${pct}%` }}
      />
    </div>
  );

  if (!showValue) {
    return <div className={cn('flex items-center', className)}>{track}</div>;
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {track}
      <span className="tabular-nums text-xs text-muted-foreground shrink-0">
        {pct}%
      </span>
    </div>
  );
}

export default ProgressBar;
