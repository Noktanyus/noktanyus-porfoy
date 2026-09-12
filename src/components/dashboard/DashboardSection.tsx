'use client';

/**
 * @file DashboardSection — Dashboard kartları için tutarlı section wrapper.
 *
 * `glass-card-premium` tabanlı, opsiyonel başlık + sağ taraf meta.
 * Liste veya tablo içeriklerini sarmalamak için tek kaynak.
 *
 * Mobile-first: küçük ekranda padding responsive.
 * Erişilebilirlik: section landmark + opsiyonel h2 başlık (ekran okuyucu dostu).
 */

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface DashboardSectionProps {
  /** Opsiyonel başlık — h2 landmark olarak render edilir */
  title?: ReactNode;
  /** Opsiyonel başlık altı açıklama */
  description?: ReactNode;
  /** Sağ taraftaki meta / aksiyon (örn: "Toplam 12") */
  meta?: ReactNode;
  /** İçerik (children) */
  children: ReactNode;
  /** Padding yoğunluğu */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** Yatay scroll/taşma durumlarında içeriği kırp */
  contained?: boolean;
  /** Ek className */
  className?: string;
  /** İçerik container className */
  bodyClassName?: string;
}

const PADDING_CLASSES = {
  none: 'p-0',
  sm: 'p-4 sm:p-5',
  md: 'p-5 sm:p-6',
  lg: 'p-6 sm:p-8',
} as const;

export function DashboardSection({
  title,
  description,
  meta,
  children,
  padding = 'md',
  contained = false,
  className,
  bodyClassName,
}: DashboardSectionProps) {
  const hasHeader = Boolean(title || description || meta);
  const headerClass = cn(
    'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2',
    padding === 'none' ? 'p-5 pb-3' : 'pb-4 mb-4 border-b border-border/40',
  );

  return (
    <section
      className={cn(
        'glass-card-premium',
        PADDING_CLASSES[padding],
        contained && 'overflow-hidden',
        className,
      )}
    >
      {hasHeader && (
        <header className={headerClass}>
          <div className="min-w-0">
            {title && (
              <h2 className="text-base font-semibold tracking-tight">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {description}
              </p>
            )}
          </div>
          {meta && <div className="text-xs text-muted-foreground">{meta}</div>}
        </header>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

export default DashboardSection;
