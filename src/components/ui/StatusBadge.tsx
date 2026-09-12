/**
 * @file StatusBadge — Durum etiketleri için TEK kaynak.
 *
 * Daha önce admin (products/coupons/newsletter), SaaS (dashboard/jobs/job
 * detail) ve marketplace yüzeylerinde ayrı ayrı kopyalanan "inline-flex
 * rounded-full px-2 py-0.5 …" rozet blokları bu component'te toplandı.
 *
 * Tasarım notları:
 * - `tone` semantik: success / warning / danger / info / neutral
 * - `dot` ile renkten bağımsız ikinci bir görsel ipucu verilir
 *   (WCAG 1.4.1 — bilgi yalnız renkle aktarılmaz)
 * - Metin her zaman görünür; ekran okuyucu için ek `srLabel` verilebilir
 *
 * Kullanım:
 * ```tsx
 * <StatusBadge tone="success" label="Aktif" dot />
 * <StatusBadge {...resolveJobStatus(job.status)} />
 * ```
 */

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'brand';

export interface StatusBadgeProps {
  /** Görünen etiket metni */
  label: ReactNode;
  /** Semantik ton (renk ailesi) */
  tone?: StatusTone;
  /** Metnin önünde küçük renkli nokta göster (renk körlüğü için ek ipucu) */
  dot?: boolean;
  /** Etiketin solunda ikon */
  icon?: ReactNode;
  /** Yalnızca ekran okuyucuya ek bağlam (ör. "Sipariş durumu: ") */
  srLabel?: string;
  /** Boyut */
  size?: 'sm' | 'md';
  /** Ek className */
  className?: string;
}

const TONE_CLASSES: Record<StatusTone, string> = {
  success:
    'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 ring-1 ring-inset ring-emerald-500/25',
  warning:
    'bg-amber-500/15 text-amber-700 dark:text-amber-300 ring-1 ring-inset ring-amber-500/25',
  danger:
    'bg-rose-500/15 text-rose-700 dark:text-rose-300 ring-1 ring-inset ring-rose-500/25',
  info: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 ring-1 ring-inset ring-sky-500/25',
  neutral:
    'bg-slate-500/15 text-slate-700 dark:text-slate-300 ring-1 ring-inset ring-slate-500/25',
  brand:
    'bg-brand-primary/10 text-brand-primary ring-1 ring-inset ring-brand-primary/25',
};

const DOT_CLASSES: Record<StatusTone, string> = {
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-rose-500',
  info: 'bg-sky-500',
  neutral: 'bg-slate-400',
  brand: 'bg-brand-primary',
};

const SIZE_CLASSES = {
  sm: 'px-2 py-0.5 text-[11px]',
  md: 'px-2.5 py-1 text-xs',
} as const;

export function StatusBadge({
  label,
  tone = 'neutral',
  dot = false,
  icon,
  srLabel,
  size = 'md',
  className,
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium whitespace-nowrap',
        TONE_CLASSES[tone],
        SIZE_CLASSES[size],
        className,
      )}
    >
      {srLabel && <span className="sr-only">{srLabel}</span>}
      {dot && (
        <span
          aria-hidden="true"
          className={cn('w-1.5 h-1.5 rounded-full shrink-0', DOT_CLASSES[tone])}
        />
      )}
      {icon && (
        <span aria-hidden="true" className="shrink-0 inline-flex items-center">
          {icon}
        </span>
      )}
      <span className="truncate">{label}</span>
    </span>
  );
}

/* ============================================================
 * Domain status çözücüleri — etiket + ton eşlemesi tek yerde.
 * Böylece aynı statü farklı ekranlarda farklı renkte görünmez.
 * ============================================================ */

export interface ResolvedStatus {
  label: string;
  tone: StatusTone;
  dot: true;
}

/** GenerationJob.status → rozet (SaaS toplu iş yüzeyleri) */
export function resolveJobStatus(status: string): ResolvedStatus {
  switch (status) {
    case 'completed':
      return { label: 'Tamamlandı', tone: 'success', dot: true };
    case 'processing':
      return { label: 'İşleniyor', tone: 'warning', dot: true };
    case 'failed':
      return { label: 'Başarısız', tone: 'danger', dot: true };
    case 'pending':
      return { label: 'Bekliyor', tone: 'neutral', dot: true };
    default:
      return { label: status, tone: 'neutral', dot: true };
  }
}

/** Aktif/pasif ikili durum (ürün, kupon, abone, popup) */
export function resolveActiveStatus(active: boolean): ResolvedStatus {
  return active
    ? { label: 'Aktif', tone: 'success', dot: true }
    : { label: 'Pasif', tone: 'neutral', dot: true };
}

/** Order.status → rozet (admin sipariş listeleri) */
export function resolveOrderStatus(status: string): ResolvedStatus {
  switch (status.toUpperCase()) {
    case 'PAID':
      return { label: 'Ödendi', tone: 'success', dot: true };
    case 'PENDING':
      return { label: 'Bekliyor', tone: 'warning', dot: true };
    case 'FAILED':
      return { label: 'Başarısız', tone: 'danger', dot: true };
    case 'REFUNDED':
      return { label: 'İade', tone: 'info', dot: true };
    case 'CANCELLED':
      return { label: 'İptal', tone: 'neutral', dot: true };
    default:
      return { label: status, tone: 'neutral', dot: true };
  }
}

/** Health/monitor durumu → rozet (/saglik, monitör listeleri) */
export function resolveHealthStatus(status: string): ResolvedStatus {
  switch (status.toLowerCase()) {
    case 'up':
    case 'ok':
    case 'healthy':
      return { label: 'Çalışıyor', tone: 'success', dot: true };
    case 'degraded':
      return { label: 'Kısmi', tone: 'warning', dot: true };
    case 'down':
    case 'error':
      return { label: 'Çalışmıyor', tone: 'danger', dot: true };
    default:
      return { label: status, tone: 'neutral', dot: true };
  }
}

export default StatusBadge;
