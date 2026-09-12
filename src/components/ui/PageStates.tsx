/**
 * @file PageStates - Loading + Error + Empty durumları için tek wrapper component.
 *
 * Bu component tek bir API ile async fetch sonuclarini yonetir:
 * - loading true ise skeleton gosterir
 * - error varsa ErrorDisplay gosterir
 * - data bossa EmptyState gosterir
 * - data varsa children render edilir
 *
 * Type-safe generic <T> ile her data tipiyle calisir.
 *
 * Kullanim:
 * ```tsx
 * <PageStates
 *   loading={isLoading}
 *   error={error}
 *   data={items}
 *   loadingVariant="card"
 *   emptyProps={{ title: "Sonuc yok", description: "..." }}
 *   onRetry={refetch}
 * >
 *   {(data) => <ItemList items={data} />}
 * </PageStates>
 * ```
 *
 * Tek kaynak: EmptyState `@/components/ui/EmptyState`'ten gelir;
 * `ErrorDisplay`'in eski kopya EmptyState'i kaldirildi.
 */

'use client';

import type { ReactNode } from 'react';
import { LoadingSkeleton, SpinnerLoading } from './LoadingSkeleton';
import { ErrorDisplay } from './ErrorDisplay';
import { EmptyState } from './EmptyState';

export type LoadingVariant =
  | 'card'
  | 'list'
  | 'detail'
  | 'blog'
  | 'project'
  | 'spinner'
  | 'text-line'
  | 'table-row'
  | 'avatar';

export interface PageStatesProps<T> {
  /** Veri fetch durumu */
  loading?: boolean;
  /** Hata objesi (varsa ErrorDisplay gosterilir) */
  error?: Error | string | null;
  /** Asil veri (null/undefined/[] ise EmptyState gosterilir) */
  data?: T | null | undefined;
  /** Retry fonksiyonu (error durumunda Tekrar Dene butonu icin) */
  onRetry?: () => void;
  /** Skeleton tipi */
  loadingVariant?: LoadingVariant;
  /** Skeleton sayisi (card/list/blog/project icin) */
  loadingCount?: number;
  /** Empty state icin title */
  emptyTitle?: string;
  /** Empty state icin aciklama */
  emptyDescription?: string;
  /** Empty state icin CTA label */
  emptyActionLabel?: string;
  /** Empty state CTA aksiyonu */
  emptyAction?: () => void;
  /** Empty state icin icon (emoji veya ReactNode) */
  emptyIcon?: ReactNode;
  /** Error title override */
  errorTitle?: string;
  /** Error mesaj override */
  errorMessage?: string;
  /** Wrapper div className */
  className?: string;
  /** Render prop (alternatif olarak children function) */
  children: ReactNode | ((data: T) => ReactNode);
  /** Ana sayfa header'a link goster (error durumunda) */
  showHomeLink?: boolean;
}

function isEmpty<T>(data: T | null | undefined): boolean {
  if (data === null || data === undefined) return true;
  if (Array.isArray(data) && data.length === 0) return true;
  return false;
}

function normalizeError(error: Error | string | null | undefined): Error | null {
  if (!error) return null;
  if (typeof error === 'string') return new Error(error);
  return error;
}

/**
 * Boilerplate standartlastirma wrapper component.
 * Loading -> Error -> Empty -> Data sirasiyla kontrol eder.
 */
export function PageStates<T>({
  loading = false,
  error,
  data,
  onRetry,
  loadingVariant = 'card',
  loadingCount = 3,
  emptyTitle = 'Sonuç bulunamadı',
  emptyDescription = 'Henüz içerik eklenmemiş. Daha sonra tekrar deneyin.',
  emptyActionLabel,
  emptyAction,
  emptyIcon,
  errorTitle,
  errorMessage,
  className = '',
  children,
  showHomeLink = true,
}: PageStatesProps<T>) {
  // 1. Loading state
  if (loading) {
    if (loadingVariant === 'spinner') {
      return (
        <div className={className}>
          <SpinnerLoading text="Yükleniyor..." />
        </div>
      );
    }
    return (
      <div className={className}>
        <LoadingSkeleton
          variant={loadingVariant as 'card' | 'list' | 'detail' | 'blog' | 'project'}
          count={loadingCount}
        />
      </div>
    );
  }

  // 2. Error state
  const normalizedError = normalizeError(error);
  if (normalizedError) {
    return (
      <div className={className}>
        <ErrorDisplay
          title={errorTitle}
          message={errorMessage ?? normalizedError.message}
          onRetry={onRetry}
          showHomeLink={showHomeLink}
          variant="card"
        />
      </div>
    );
  }

  // 3. Empty state — TEK KAYNAK (EmptyState.tsx)
  if (isEmpty(data)) {
    return (
      <div className={className}>
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          icon={emptyIcon}
          action={
            emptyAction && emptyActionLabel
              ? { label: emptyActionLabel, onClick: emptyAction }
              : undefined
          }
        />
      </div>
    );
  }

  // 4. Data state
  if (typeof children === 'function') {
    return <div className={className}>{(children as (data: T) => ReactNode)(data as T)}</div>;
  }
  return <div className={className}>{children}</div>;
}

/**
 * Daha basit kullanim icin alias.
 */
export default PageStates;
