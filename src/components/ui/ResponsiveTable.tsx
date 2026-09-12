'use client';

/**
 * @file ResponsiveTable - Mobil uyumlu tablo wrapper.
 *
 * Mobile responsive ozellikler:
 * - overflow-x-auto ile yatay kaydirma
 * - min-width ile desktop'ta tablo yapisi korunur
 * - responsive padding
 * - sticky header opsiyonel
 *
 * Kullanim:
 * ```tsx
 * <ResponsiveTable>
 *   <table>
 *     <thead><tr><th>Ad</th><th>Email</th></tr></thead>
 *     <tbody>...</tbody>
 *   </table>
 * </ResponsiveTable>
 * ```
 */

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ResponsiveTableProps {
  children: ReactNode;
  /** Wrapper className — `cn()` ile birlestirilir, override edilebilir */
  className?: string;
  /** Min-width (default: 640px) - desktop'ta tablo genisligi */
  minWidth?: string;
  /** Sticky header */
  stickyHeader?: boolean;
  /** Bos durum mesaji */
  emptyMessage?: string;
  /** Yukleniyor durumu */
  loading?: boolean;
  /**
   * Ekran okuyucular icin tablo basligi. Gorsel olarak gizlenir (`<caption>`
   * + sr-only) ama tablonun ne listeledigini bildirir.
   */
  caption?: string;
}

/** Wrapper icin varsayilan yuzey siniflari — cn() ile override edilebilir. */
const WRAPPER_BASE = 'overflow-x-auto rounded-xl border border-border/60';

export function ResponsiveTable({
  children,
  className,
  minWidth = '640px',
  stickyHeader = false,
  emptyMessage,
  loading = false,
  caption,
}: ResponsiveTableProps) {
  if (loading) {
    return (
      <div className={cn(WRAPPER_BASE, className)}>
        <div
          className="flex items-center justify-center p-12 text-muted-foreground"
          role="status"
          aria-live="polite"
        >
          <div
            aria-hidden="true"
            className="w-8 h-8 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin mr-3"
          />
          Yükleniyor...
        </div>
      </div>
    );
  }

  return (
    <div className={cn(WRAPPER_BASE, className)}>
      <table
        className="w-full"
        style={{ minWidth }}
      >
        {caption && <caption className="sr-only">{caption}</caption>}
        {stickyHeader && (
          <style>{`
            thead th {
              position: sticky;
              top: 0;
              z-index: 10;
              background: inherit;
            }
          `}</style>
        )}
        {children}
      </table>
      {emptyMessage && (
        <div
          className="text-center py-8 px-4 text-sm text-muted-foreground"
          role="status"
          aria-live="polite"
        >
          {emptyMessage}
        </div>
      )}
    </div>
  );
}

export default ResponsiveTable;
