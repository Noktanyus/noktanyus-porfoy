"use client";

/**
 * @file LoadingSkeleton - Tüm sayfalar için tutarlı iskelet yükleme ekranı
 *
 * a11y: Skeleton container'a `role="status"` + `aria-busy="true"` +
 *       `aria-live="polite"` eklenmistir. Boylece ekran okuyucular
 *       "Yukleniyor" bilgisini duyurur ve islem devam ederken mevcut
 *       icerigin guncellenmesini bekler.
 */

interface SkeletonProps {
  variant?: "blog" | "project" | "detail" | "list" | "card" | "text-line" | "avatar" | "button" | "table-row";
  count?: number;
  className?: string;
  /** Override the default aria-label / screen-reader announcement. */
  loadingLabel?: string;
}

export function LoadingSkeleton({ variant = "list", count = 1, className = "", loadingLabel = "Yükleniyor" }: SkeletonProps) {
  const items = Array.from({ length: count }, (_, i) => i);

  if (variant === "blog") {
    return (
      <div
        role="status"
        aria-busy="true"
        aria-live="polite"
        aria-label={loadingLabel}
        className={`grid md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 ${className}`}
      >
        <span className="sr-only">{loadingLabel}</span>
        {items.map((i) => (
          <div key={i} className="glass-card-premium overflow-hidden animate-pulse" aria-hidden="true">
            <div className="h-52 bg-gray-200/50 dark:bg-gray-700/30" />
            <div className="p-5 space-y-3">
              <div className="h-5 bg-gray-200/50 dark:bg-gray-700/30 rounded-lg w-3/4" />
              <div className="h-4 bg-gray-200/50 dark:bg-gray-700/30 rounded-lg w-full" />
              <div className="h-3 bg-gray-200/50 dark:bg-gray-700/30 rounded-lg w-1/2" />
              <div className="flex gap-2 pt-2">
                <div className="h-6 w-16 bg-gray-200/50 dark:bg-gray-700/30 rounded-full" />
                <div className="h-6 w-16 bg-gray-200/50 dark:bg-gray-700/30 rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === "project") {
    return (
      <div
        role="status"
        aria-busy="true"
        aria-live="polite"
        aria-label={loadingLabel}
        className={`space-y-6 ${className}`}
      >
        <span className="sr-only">{loadingLabel}</span>
        {items.map((i) => (
          <div key={i} className="glass-card-premium overflow-hidden flex flex-col lg:flex-row animate-pulse" aria-hidden="true">
            <div className="lg:w-2/5 xl:w-1/3 h-56 lg:h-auto lg:min-h-[220px] bg-gray-200/50 dark:bg-gray-700/30" />
            <div className="lg:w-3/5 xl:w-2/3 p-6 flex flex-col gap-3">
              <div className="h-7 bg-gray-200/50 dark:bg-gray-700/30 rounded-lg w-3/4" />
              <div className="flex gap-2">
                <div className="h-6 w-20 bg-gray-200/50 dark:bg-gray-700/30 rounded-full" />
                <div className="h-6 w-20 bg-gray-200/50 dark:bg-gray-700/30 rounded-full" />
              </div>
              <div className="space-y-2 flex-grow">
                <div className="h-4 bg-gray-200/50 dark:bg-gray-700/30 rounded" />
                <div className="h-4 bg-gray-200/50 dark:bg-gray-700/30 rounded w-5/6" />
                <div className="h-4 bg-gray-200/50 dark:bg-gray-700/30 rounded w-4/6" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === "detail") {
    return (
      <div
        role="status"
        aria-busy="true"
        aria-live="polite"
        aria-label={loadingLabel}
        className={`max-w-4xl mx-auto space-y-6 ${className}`}
      >
        <span className="sr-only">{loadingLabel}</span>
        <div className="glass-card-premium p-8 space-y-4 animate-pulse" aria-hidden="true">
          <div className="h-10 bg-gray-200/50 dark:bg-gray-700/30 rounded-lg w-3/4" />
          <div className="h-5 bg-gray-200/50 dark:bg-gray-700/30 rounded w-1/2" />
          <div className="flex gap-3 pt-2">
            <div className="h-7 w-24 bg-gray-200/50 dark:bg-gray-700/30 rounded-full" />
            <div className="h-7 w-24 bg-gray-200/50 dark:bg-gray-700/30 rounded-full" />
          </div>
        </div>
        <div className="h-72 sm:h-96 glass-card-premium rounded-2xl bg-gray-200/50 dark:bg-gray-700/30" aria-hidden="true" />
        <div className="glass-card-premium p-8 space-y-4" aria-hidden="true">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-4 bg-gray-200/50 dark:bg-gray-700/30 rounded"
                 style={{ width: i === 4 ? "75%" : i === 2 ? "85%" : "100%" }} />
          ))}
        </div>
      </div>
    );
  }

  // card variant - genel kart iskeleti
  if (variant === "card") {
    return (
      <div
        role="status"
        aria-busy="true"
        aria-live="polite"
        aria-label={loadingLabel}
        className={`grid md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 ${className}`}
      >
        <span className="sr-only">{loadingLabel}</span>
        {items.map((i) => (
          <div key={i} className="glass-card-premium p-5 animate-pulse" aria-hidden="true">
            <div className="h-40 bg-gray-200/50 dark:bg-gray-700/30 rounded-lg mb-4" />
            <div className="space-y-2">
              <div className="h-5 bg-gray-200/50 dark:bg-gray-700/30 rounded w-3/4" />
              <div className="h-3 bg-gray-200/50 dark:bg-gray-700/30 rounded w-full" />
              <div className="h-3 bg-gray-200/50 dark:bg-gray-700/30 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // text-line variant - sadece metin satirlari
  if (variant === "text-line") {
    return (
      <div
        role="status"
        aria-busy="true"
        aria-live="polite"
        aria-label={loadingLabel}
        className={`space-y-3 ${className}`}
      >
        <span className="sr-only">{loadingLabel}</span>
        {items.map((i) => (
          <div key={i} className="space-y-2 animate-pulse" aria-hidden="true">
            <div
              className="h-4 bg-gray-200/50 dark:bg-gray-700/30 rounded"
              style={{ width: `${Math.max(60, 100 - i * 8)}%` }}
            />
            <div
              className="h-3 bg-gray-200/50 dark:bg-gray-700/30 rounded"
              style={{ width: `${Math.max(40, 90 - i * 12)}%` }}
            />
          </div>
        ))}
      </div>
    );
  }

  // avatar variant
  if (variant === "avatar") {
    return (
      <div
        role="status"
        aria-busy="true"
        aria-live="polite"
        aria-label={loadingLabel}
        className={`flex items-center gap-4 ${className}`}
      >
        <span className="sr-only">{loadingLabel}</span>
        {items.map((i) => (
          <div key={i} className="flex items-center gap-3 animate-pulse" aria-hidden="true">
            <div className="w-12 h-12 bg-gray-200/50 dark:bg-gray-700/30 rounded-full flex-shrink-0" />
            <div className="space-y-2 min-w-0">
              <div className="h-4 w-24 bg-gray-200/50 dark:bg-gray-700/30 rounded" />
              <div className="h-3 w-16 bg-gray-200/50 dark:bg-gray-700/30 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // button variant
  if (variant === "button") {
    return (
      <div
        role="status"
        aria-busy="true"
        aria-live="polite"
        aria-label={loadingLabel}
        className={`flex flex-wrap gap-3 ${className}`}
      >
        <span className="sr-only">{loadingLabel}</span>
        {items.map((i) => (
          <div
            key={i}
            className="h-11 w-32 bg-gray-200/50 dark:bg-gray-700/30 rounded-xl animate-pulse"
            aria-hidden="true"
          />
        ))}
      </div>
    );
  }

  // table-row variant
  if (variant === "table-row") {
    return (
      <div
        role="status"
        aria-busy="true"
        aria-live="polite"
        aria-label={loadingLabel}
        className={`space-y-2 ${className}`}
      >
        <span className="sr-only">{loadingLabel}</span>
        <div className="overflow-x-auto rounded-xl border border-gray-200/50 dark:border-gray-700/50">
          <table className="w-full min-w-[640px]">
            <thead className="bg-gray-100/50 dark:bg-gray-800/50">
              <tr>
                {[...Array(4)].map((_, i) => (
                  <th key={i} scope="col" className="px-4 py-3 text-left">
                    <div className="h-3 w-20 bg-gray-200/50 dark:bg-gray-700/30 rounded animate-pulse" aria-hidden="true" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((i) => (
                <tr key={i} className="border-t border-gray-200/30 dark:border-gray-700/30" aria-hidden="true">
                  {[...Array(4)].map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div
                        className="h-4 bg-gray-200/50 dark:bg-gray-700/30 rounded animate-pulse"
                        style={{ width: `${Math.max(40, 90 - j * 15)}%` }}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Default: list variant
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      aria-label={loadingLabel}
      className={`space-y-8 ${className}`}
    >
      <span className="sr-only">{loadingLabel}</span>
      <div className="flex flex-col items-center gap-5" aria-hidden="true">
        <div className="w-full max-w-2xl h-14 glass-card-premium rounded-full animate-pulse" />
        <div className="flex gap-2">
          {items.slice(0, 3).map((i) => (
            <div key={i} className="h-9 w-20 glass-card-premium rounded-full animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Sayfa yüklenirken gösterilen ana skeleton
 */
export function PageSkeleton({ variant = "list" }: { variant?: "blog" | "project" | "detail" | "list" | "card" }) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      aria-label="Sayfa yükleniyor"
      className="section-glass-hero bg-blob-decoration"
    >
      <span className="sr-only">Sayfa yükleniyor</span>
      <div className="relative z-10 space-y-8">
        <div className="text-center mb-8 sm:mb-12">
          <div className="h-14 w-64 mx-auto glass-card-premium rounded-full animate-pulse mb-4" aria-hidden="true" />
          <div className="h-6 w-96 mx-auto glass-card-premium rounded-lg animate-pulse" aria-hidden="true" />
        </div>
        <LoadingSkeleton variant={variant} count={variant === "project" ? 3 : 6} />
      </div>
    </div>
  );
}

/**
 * Spinner tipi loading
 */
export function SpinnerLoading({ text = "Yükleniyor..." }: { text?: string }) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className="flex flex-col items-center justify-center min-h-[40vh] gap-4"
    >
      <div className="w-12 h-12 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin" aria-hidden="true" />
      <p className="text-gray-500 dark:text-gray-400 font-medium">{text}</p>
      <span className="sr-only">{text}</span>
    </div>
  );
}

/**
 * Submit button icinde kullanilan spinner.
 * Boyut ve renk parent tarafindan override edilebilir.
 */
export function ButtonSpinner({ size = 'medium' }: { size?: 'small' | 'medium' }) {
  const sizeClass = size === 'small' ? 'w-3.5 h-3.5 border-2' : 'w-4 h-4 border-2';
  return (
    <span
      aria-hidden="true"
      className={`inline-block ${sizeClass} border-white/40 border-t-white rounded-full animate-spin`}
    />
  );
}
