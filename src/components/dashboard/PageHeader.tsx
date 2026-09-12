'use client';

/**
 * @file PageHeader — Dashboard yüzeyleri için ortak sayfa başlığı.
 *
 * Tutarlı bileşenler:
 * - Opsiyonel breadcrumb (üst satır)
 * - Opsiyonel geri linki (← Başlık)
 * - h1 başlık + açıklama
 * - Sağ tarafta aksiyon butonları / meta içerik (children)
 *
 * Mobile-first: küçük ekranlarda yatay istif, md+ yan yana dizilim.
 * Erişilebilirlik: h1 semantic, başlık alanı `<header>` landmark içinde.
 *
 * Kullanım:
 * ```tsx
 * <PageHeader
 *   title="Monitörler"
 *   description={5 + ' monitör'}
 *   backHref="/dashboard"
 *   backLabel="Geri"
 *   actions={<Link href="...">Yeni</Link>}
 * />
 * ```
 */

import type { ReactNode } from 'react';
import Link from 'next/link';
import { FaArrowLeft } from 'react-icons/fa';
import { cn } from '@/lib/utils';

export interface PageHeaderProps {
  /** Sayfa başlığı (h1) */
  title: ReactNode;
  /** Sayfa açıklaması (subtitle) */
  description?: ReactNode;
  /** Geri linki — sol üst köşede "← ..." gösterir */
  backHref?: string;
  /** Geri linki etiketi (varsayılan: "Geri") */
  backLabel?: string;
  /** Sayfa üstünde küçük breadcrumb (örn: "Workspace / Branding") */
  breadcrumb?: ReactNode;
  /** Sağ taraftaki aksiyon butonları / meta */
  actions?: ReactNode;
  /** Heading düzeyi (varsayılan: h1) — section başlığı gibi h2 gerekirse */
  as?: 'h1' | 'h2';
  /** Ek className */
  className?: string;
}

export function PageHeader({
  title,
  description,
  backHref,
  backLabel = 'Geri',
  breadcrumb,
  actions,
  as = 'h1',
  className,
}: PageHeaderProps) {
  const Heading = as;
  const showBackRow = Boolean(breadcrumb || backHref);

  return (
    <header className={cn('space-y-3', className)}>
      {showBackRow && (
        <div className="flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 min-w-0">
            {backHref && (
              <Link
                href={backHref}
                className={cn(
                  'inline-flex items-center gap-1.5 min-h-[44px] px-2 -ml-2 rounded-md',
                  'text-muted-foreground hover:text-foreground transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                )}
                aria-label={backLabel}
              >
                <FaArrowLeft className="w-3 h-3" aria-hidden="true" />
                <span>{backLabel}</span>
              </Link>
            )}
            {breadcrumb && (
              <nav aria-label="Breadcrumb" className="text-muted-foreground truncate">
                {breadcrumb}
              </nav>
            )}
          </div>
        </div>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 flex-1">
          <Heading
            className={cn(
              'text-2xl font-bold tracking-tight',
              as === 'h2' && 'text-xl',
            )}
          >
            {title}
          </Heading>
          {description && (
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}

export default PageHeader;
