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

/**
 * İletişim sayfası için özel 2 sütunlu skeleton layout
 */
export function ContactSkeleton({ className = "" }: { className?: string }) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      aria-label="İletişim sayfası yükleniyor"
      className={`container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8 lg:py-12 ${className}`}
    >
      <span className="sr-only">İletişim sayfası yükleniyor</span>

      {/* Header Skeleton */}
      <div className="section-header text-center mb-8 sm:mb-12 animate-pulse" aria-hidden="true">
        <div className="h-9 sm:h-11 w-56 sm:w-72 bg-gray-200/60 dark:bg-gray-700/40 rounded-xl mx-auto mb-3" />
        <div className="h-4 sm:h-5 w-full max-w-xl bg-gray-200/50 dark:bg-gray-700/30 rounded-lg mx-auto" />
      </div>

      {/* Main Glass-Card Layout: Left contact info, Right contact form */}
      <div className="max-w-7xl mx-auto">
        <div
          className="flex flex-col lg:grid lg:grid-cols-3 gap-6 md:gap-8 lg:gap-12 glass-card p-4 sm:p-6 md:p-8 animate-pulse"
          aria-hidden="true"
        >
          {/* Left Column: Contact info */}
          <div className="lg:col-span-1 order-2 lg:order-1 space-y-5">
            <div className="h-7 w-44 bg-gray-200/60 dark:bg-gray-700/40 rounded-lg" />
            <div className="space-y-2">
              <div className="h-4 w-full bg-gray-200/50 dark:bg-gray-700/30 rounded" />
              <div className="h-4 w-5/6 bg-gray-200/50 dark:bg-gray-700/30 rounded" />
            </div>

            {/* Email item */}
            <div className="pt-2">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-100/40 dark:bg-gray-800/40 border border-gray-200/30 dark:border-gray-700/30">
                <div className="w-5 h-5 bg-gray-200/70 dark:bg-gray-700/50 rounded-full flex-shrink-0" />
                <div className="h-4 w-44 bg-gray-200/70 dark:bg-gray-700/50 rounded" />
              </div>
            </div>

            {/* Social media links */}
            <div className="pt-4 border-t border-white/30 dark:border-white/10 space-y-3">
              <div className="h-5 w-32 bg-gray-200/60 dark:bg-gray-700/40 rounded" />
              <div className="flex gap-3">
                <div className="w-12 h-12 bg-gray-200/50 dark:bg-gray-700/30 rounded-lg" />
                <div className="w-12 h-12 bg-gray-200/50 dark:bg-gray-700/30 rounded-lg" />
                <div className="w-12 h-12 bg-gray-200/50 dark:bg-gray-700/30 rounded-lg" />
              </div>
            </div>
          </div>

          {/* Right Column: Contact form */}
          <div className="lg:col-span-2 order-1 lg:order-2 space-y-5">
            {/* Name and Email Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="space-y-2">
                <div className="h-4 w-28 bg-gray-200/60 dark:bg-gray-700/40 rounded" />
                <div className="h-12 w-full bg-gray-200/40 dark:bg-gray-800/40 rounded-lg border border-gray-200/30 dark:border-gray-700/30" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-32 bg-gray-200/60 dark:bg-gray-700/40 rounded" />
                <div className="h-12 w-full bg-gray-200/40 dark:bg-gray-800/40 rounded-lg border border-gray-200/30 dark:border-gray-700/30" />
              </div>
            </div>

            {/* Subject field */}
            <div className="space-y-2">
              <div className="h-4 w-20 bg-gray-200/60 dark:bg-gray-700/40 rounded" />
              <div className="h-12 w-full bg-gray-200/40 dark:bg-gray-800/40 rounded-lg border border-gray-200/30 dark:border-gray-700/30" />
            </div>

            {/* Message field */}
            <div className="space-y-2">
              <div className="h-4 w-24 bg-gray-200/60 dark:bg-gray-700/40 rounded" />
              <div className="h-32 w-full bg-gray-200/40 dark:bg-gray-800/40 rounded-lg border border-gray-200/30 dark:border-gray-700/30" />
            </div>

            {/* Turnstile + Submit Button row */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
              <div className="h-14 w-60 bg-gray-200/40 dark:bg-gray-800/40 rounded-lg border border-gray-200/30 dark:border-gray-700/30" />
              <div className="h-12 w-40 bg-brand-primary/40 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Dashboard genel görünüm iskeleti (KPI kartları + tablo + sağ panel)
 */
export function DashboardSkeleton({ title = "Panel yükleniyor" }: { title?: string }) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      aria-label={title}
      className="space-y-6 animate-pulse"
    >
      <span className="sr-only">{title}</span>
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-border/40">
        <div className="space-y-2">
          <div className="h-8 w-48 sm:w-64 bg-gray-200/60 dark:bg-gray-700/40 rounded-lg" />
          <div className="h-4 w-72 sm:w-96 bg-gray-200/40 dark:bg-gray-700/30 rounded" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-10 w-28 bg-gray-200/60 dark:bg-gray-700/40 rounded-xl" />
          <div className="h-10 w-32 bg-gray-200/60 dark:bg-gray-700/40 rounded-xl" />
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="glass-card-premium p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-4 w-24 bg-gray-200/50 dark:bg-gray-700/30 rounded" />
              <div className="w-10 h-10 rounded-xl bg-gray-200/60 dark:bg-gray-700/40" />
            </div>
            <div className="h-8 w-32 bg-gray-200/70 dark:bg-gray-700/50 rounded-lg" />
            <div className="h-3 w-40 bg-gray-200/40 dark:bg-gray-700/20 rounded" />
          </div>
        ))}
      </div>

      {/* Main Grid: 2/3 Content + 1/3 Side card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card-premium p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border/30">
            <div className="h-5 w-40 bg-gray-200/60 dark:bg-gray-700/40 rounded" />
            <div className="h-8 w-24 bg-gray-200/40 dark:bg-gray-700/30 rounded-lg" />
          </div>
          <div className="space-y-3 pt-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-border/20 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gray-200/60 dark:bg-gray-700/40" />
                  <div className="space-y-1.5">
                    <div className="h-4 w-36 bg-gray-200/60 dark:bg-gray-700/40 rounded" />
                    <div className="h-3 w-24 bg-gray-200/40 dark:bg-gray-700/20 rounded" />
                  </div>
                </div>
                <div className="h-6 w-20 bg-gray-200/50 dark:bg-gray-700/30 rounded-full" />
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card-premium p-5 space-y-4">
          <div className="h-5 w-32 bg-gray-200/60 dark:bg-gray-700/40 rounded" />
          <div className="h-28 rounded-xl bg-gray-200/40 dark:bg-gray-700/20" />
          <div className="space-y-2 pt-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-10 w-full rounded-lg bg-gray-200/50 dark:bg-gray-700/30" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Tablo sayfaları için iskelet (Başlık, Arama/Filtre, Tablo, Sayfalama)
 */
export function TableSkeleton({
  title = "Liste yükleniyor",
  rows = 5,
  columns = 5,
}: {
  title?: string;
  rows?: number;
  columns?: number;
}) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      aria-label={title}
      className="space-y-6 animate-pulse"
    >
      <span className="sr-only">{title}</span>
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-44 sm:w-60 bg-gray-200/60 dark:bg-gray-700/40 rounded-lg" />
          <div className="h-4 w-64 sm:w-80 bg-gray-200/40 dark:bg-gray-700/30 rounded" />
        </div>
        <div className="h-10 w-36 bg-gray-200/60 dark:bg-gray-700/40 rounded-xl" />
      </div>

      {/* Filter / Search Bar */}
      <div className="glass-card-premium p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="h-10 w-full sm:w-72 bg-gray-200/50 dark:bg-gray-700/30 rounded-lg" />
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="h-10 w-28 bg-gray-200/50 dark:bg-gray-700/30 rounded-lg" />
          <div className="h-10 w-28 bg-gray-200/50 dark:bg-gray-700/30 rounded-lg" />
        </div>
      </div>

      {/* Table Container */}
      <div className="glass-card-premium overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-100/60 dark:bg-gray-800/60 border-b border-border/40">
              <tr>
                {[...Array(columns)].map((_, i) => (
                  <th key={i} className="px-5 py-3.5">
                    <div className="h-3.5 w-20 bg-gray-200/60 dark:bg-gray-700/40 rounded" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {[...Array(rows)].map((_, i) => (
                <tr key={i} className="hover:bg-muted/30 transition-colors">
                  {[...Array(columns)].map((_, j) => (
                    <td key={j} className="px-5 py-4">
                      <div
                        className="h-4 bg-gray-200/50 dark:bg-gray-700/30 rounded"
                        style={{ width: `${Math.max(35, 85 - j * 12 - (i % 3) * 10)}%` }}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination footer */}
        <div className="p-4 border-t border-border/30 flex items-center justify-between">
          <div className="h-4 w-32 bg-gray-200/40 dark:bg-gray-700/30 rounded" />
          <div className="flex gap-1">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="w-8 h-8 rounded-lg bg-gray-200/50 dark:bg-gray-700/30" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Ürünler veya şablonlar için kart ızgarası iskeleti
 */
export function CardsGridSkeleton({
  title = "İçerik yükleniyor",
  count = 6,
  columns = 3,
}: {
  title?: string;
  count?: number;
  columns?: 2 | 3 | 4;
}) {
  const colClass =
    columns === 4
      ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
      : columns === 2
      ? "grid-cols-1 md:grid-cols-2"
      : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";

  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      aria-label={title}
      className="space-y-6 animate-pulse"
    >
      <span className="sr-only">{title}</span>
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-48 sm:w-64 bg-gray-200/60 dark:bg-gray-700/40 rounded-lg" />
          <div className="h-4 w-72 sm:w-96 bg-gray-200/40 dark:bg-gray-700/30 rounded" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-32 bg-gray-200/60 dark:bg-gray-700/40 rounded-xl" />
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap gap-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-8 w-24 rounded-full bg-gray-200/50 dark:bg-gray-700/30" />
        ))}
      </div>

      {/* Card Grid */}
      <div className={`grid ${colClass} gap-6`}>
        {[...Array(count)].map((_, i) => (
          <div key={i} className="glass-card-premium overflow-hidden flex flex-col">
            <div className="h-48 bg-gray-200/60 dark:bg-gray-700/40 w-full" />
            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="h-5 w-20 rounded-full bg-gray-200/50 dark:bg-gray-700/30" />
                  <div className="h-4 w-14 rounded bg-gray-200/40 dark:bg-gray-700/20" />
                </div>
                <div className="h-6 w-4/5 rounded-lg bg-gray-200/70 dark:bg-gray-700/50" />
                <div className="space-y-1.5 pt-1">
                  <div className="h-3.5 w-full rounded bg-gray-200/40 dark:bg-gray-700/30" />
                  <div className="h-3.5 w-3/4 rounded bg-gray-200/40 dark:bg-gray-700/30" />
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border/30">
                <div className="h-6 w-24 rounded bg-gray-200/60 dark:bg-gray-700/40" />
                <div className="h-9 w-24 rounded-xl bg-gray-200/60 dark:bg-gray-700/40" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Sipariş detayı veya tekil öğe detayı için iskelet
 */
export function DetailSkeleton({ title = "Detaylar yükleniyor" }: { title?: string }) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      aria-label={title}
      className="space-y-6 animate-pulse max-w-6xl mx-auto"
    >
      <span className="sr-only">{title}</span>
      {/* Top back bar */}
      <div className="flex items-center justify-between">
        <div className="h-5 w-32 bg-gray-200/60 dark:bg-gray-700/40 rounded" />
        <div className="h-7 w-28 bg-gray-200/60 dark:bg-gray-700/40 rounded-full" />
      </div>

      {/* Main Header Card */}
      <div className="glass-card-premium p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="h-8 w-64 bg-gray-200/70 dark:bg-gray-700/50 rounded-lg" />
            <div className="h-4 w-48 bg-gray-200/40 dark:bg-gray-700/30 rounded" />
          </div>
          <div className="flex gap-3">
            <div className="h-10 w-28 bg-gray-200/60 dark:bg-gray-700/40 rounded-xl" />
            <div className="h-10 w-32 bg-gray-200/60 dark:bg-gray-700/40 rounded-xl" />
          </div>
        </div>

        {/* 4 info boxes */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-border/30">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-3 rounded-xl bg-gray-100/50 dark:bg-gray-800/40 space-y-2">
              <div className="h-3 w-16 bg-gray-200/50 dark:bg-gray-700/30 rounded" />
              <div className="h-5 w-24 bg-gray-200/70 dark:bg-gray-700/50 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Items Breakdown Card */}
      <div className="glass-card-premium p-6 space-y-4">
        <div className="h-6 w-36 bg-gray-200/70 dark:bg-gray-700/50 rounded" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center justify-between py-3 border-b border-border/20 last:border-0">
              <div className="space-y-1.5">
                <div className="h-4 w-56 bg-gray-200/60 dark:bg-gray-700/40 rounded" />
                <div className="h-3 w-32 bg-gray-200/40 dark:bg-gray-700/20 rounded" />
              </div>
              <div className="h-5 w-20 bg-gray-200/60 dark:bg-gray-700/40 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Ödeme sayfası için iki sütunlu iskelet (Sol: Ödeme/Müşteri, Sağ: Sipariş Özeti)
 */
export function CheckoutSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      aria-label="Ödeme sayfası yükleniyor"
      className="container mx-auto px-4 py-8 max-w-5xl space-y-6 animate-pulse"
    >
      <span className="sr-only">Ödeme sayfası yükleniyor</span>
      <div className="h-4 w-32 bg-gray-200/60 dark:bg-gray-700/40 rounded mb-4" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sol Kolon: Ödeme / Müşteri Alanı */}
        <div className="lg:col-span-7 space-y-6">
          <div className="glass-card-premium p-6 space-y-5">
            <div className="h-7 w-48 bg-gray-200/70 dark:bg-gray-700/50 rounded-lg" />
            <div className="h-4 w-72 bg-gray-200/40 dark:bg-gray-700/30 rounded" />

            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="h-3.5 w-20 bg-gray-200/50 dark:bg-gray-700/30 rounded" />
                  <div className="h-11 w-full bg-gray-200/40 dark:bg-gray-800/40 rounded-lg" />
                </div>
                <div className="space-y-2">
                  <div className="h-3.5 w-24 bg-gray-200/50 dark:bg-gray-700/30 rounded" />
                  <div className="h-11 w-full bg-gray-200/40 dark:bg-gray-800/40 rounded-lg" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="h-3.5 w-16 bg-gray-200/50 dark:bg-gray-700/30 rounded" />
                <div className="h-11 w-full bg-gray-200/40 dark:bg-gray-800/40 rounded-lg" />
              </div>

              {/* PayTR iframe placeholder */}
              <div className="h-64 w-full rounded-xl bg-gray-100/60 dark:bg-gray-800/60 border border-border/40 flex items-center justify-center">
                <div className="h-4 w-40 bg-gray-200/50 dark:bg-gray-700/30 rounded" />
              </div>

              <div className="h-12 w-full rounded-xl bg-brand-primary/40" />
            </div>
          </div>
        </div>

        {/* Sağ Kolon: Sipariş Özeti */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-card-premium p-6 space-y-4">
            <div className="h-6 w-36 bg-gray-200/70 dark:bg-gray-700/50 rounded-lg" />
            <div className="flex gap-4 py-3 border-b border-border/30">
              <div className="w-16 h-16 rounded-lg bg-gray-200/60 dark:bg-gray-700/40 flex-shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="h-4 w-40 bg-gray-200/60 dark:bg-gray-700/40 rounded" />
                <div className="h-3 w-20 bg-gray-200/40 dark:bg-gray-700/30 rounded" />
              </div>
            </div>

            <div className="space-y-2.5 pt-2">
              <div className="flex justify-between">
                <div className="h-3.5 w-20 bg-gray-200/40 dark:bg-gray-700/30 rounded" />
                <div className="h-3.5 w-16 bg-gray-200/50 dark:bg-gray-700/30 rounded" />
              </div>
              <div className="flex justify-between">
                <div className="h-3.5 w-16 bg-gray-200/40 dark:bg-gray-700/30 rounded" />
                <div className="h-3.5 w-12 bg-gray-200/50 dark:bg-gray-700/30 rounded" />
              </div>
              <div className="flex justify-between pt-3 border-t border-border/30">
                <div className="h-5 w-24 bg-gray-200/70 dark:bg-gray-700/50 rounded" />
                <div className="h-5 w-20 bg-gray-200/70 dark:bg-gray-700/50 rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Dokümantasyon sayfası için iki sütunlu iskelet (Sidebar + İçerik)
 */
export function DocsSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      aria-label="Dokümanlar yükleniyor"
      className="container mx-auto px-4 py-8 max-w-7xl animate-pulse"
    >
      <span className="sr-only">Dokümanlar yükleniyor</span>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Sol Sidebar */}
        <div className="md:col-span-3 space-y-4">
          <div className="h-10 w-full rounded-xl bg-gray-200/50 dark:bg-gray-700/30 mb-6" />
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-6 w-3/4 rounded bg-gray-200/40 dark:bg-gray-700/20" />
            ))}
          </div>
        </div>

        {/* Sağ İçerik Alanı */}
        <div className="md:col-span-9 space-y-6">
          <div className="space-y-3 pb-6 border-b border-border/30">
            <div className="h-4 w-28 bg-gray-200/40 dark:bg-gray-700/30 rounded" />
            <div className="h-9 w-3/5 bg-gray-200/70 dark:bg-gray-700/50 rounded-lg" />
            <div className="h-4 w-4/5 bg-gray-200/50 dark:bg-gray-700/30 rounded" />
          </div>

          <div className="space-y-3">
            <div className="h-4 w-full bg-gray-200/40 dark:bg-gray-700/20 rounded" />
            <div className="h-4 w-11/12 bg-gray-200/40 dark:bg-gray-700/20 rounded" />
            <div className="h-4 w-4/5 bg-gray-200/40 dark:bg-gray-700/20 rounded" />
          </div>

          {/* Code block box */}
          <div className="h-44 rounded-xl bg-gray-900/40 border border-border/30 p-4 space-y-2">
            <div className="h-3 w-16 bg-gray-600/50 rounded mb-3" />
            <div className="h-3.5 w-3/4 bg-gray-700/50 rounded" />
            <div className="h-3.5 w-1/2 bg-gray-700/50 rounded" />
            <div className="h-3.5 w-2/3 bg-gray-700/50 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Giriş / Kayıt sayfası için iskelet
 */
export function AuthFormSkeleton({ title = "Giriş sayfası yükleniyor" }: { title?: string }) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      aria-label={title}
      className="min-h-[70vh] flex items-center justify-center px-4 py-8 animate-pulse"
    >
      <span className="sr-only">{title}</span>
      <div className="w-full max-w-md glass-card-premium p-8 space-y-6">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-gray-200/70 dark:bg-gray-700/50 mx-auto" />
          <div className="h-7 w-48 bg-gray-200/70 dark:bg-gray-700/50 rounded-lg mx-auto" />
          <div className="h-4 w-64 bg-gray-200/40 dark:bg-gray-700/30 rounded mx-auto" />
        </div>

        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <div className="h-3.5 w-16 bg-gray-200/50 dark:bg-gray-700/30 rounded" />
            <div className="h-11 w-full rounded-xl bg-gray-200/40 dark:bg-gray-800/40 border border-border/30" />
          </div>
          <div className="space-y-2">
            <div className="h-3.5 w-14 bg-gray-200/50 dark:bg-gray-700/30 rounded" />
            <div className="h-11 w-full rounded-xl bg-gray-200/40 dark:bg-gray-800/40 border border-border/30" />
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="h-4 w-28 bg-gray-200/40 dark:bg-gray-700/30 rounded" />
            <div className="h-4 w-24 bg-gray-200/40 dark:bg-gray-700/30 rounded" />
          </div>

          <div className="h-11 w-full rounded-xl bg-brand-primary/40 pt-2" />

          <div className="pt-2">
            <div className="h-11 w-full rounded-xl bg-gray-200/40 dark:bg-gray-800/40 border border-border/30" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Ayarlar / Profil form iskeleti
 */
export function SettingsFormSkeleton({ title = "Ayarlar yükleniyor" }: { title?: string }) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      aria-label={title}
      className="space-y-6 max-w-4xl animate-pulse"
    >
      <span className="sr-only">{title}</span>
      <div className="space-y-2 pb-2 border-b border-border/40">
        <div className="h-8 w-48 bg-gray-200/70 dark:bg-gray-700/50 rounded-lg" />
        <div className="h-4 w-72 bg-gray-200/40 dark:bg-gray-700/30 rounded" />
      </div>

      <div className="flex gap-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-9 w-28 rounded-lg bg-gray-200/50 dark:bg-gray-700/30" />
        ))}
      </div>

      <div className="glass-card-premium p-6 space-y-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 w-32 bg-gray-200/60 dark:bg-gray-700/40 rounded" />
            <div className="h-11 w-full rounded-lg bg-gray-200/40 dark:bg-gray-800/40 border border-border/30" />
          </div>
        ))}
        <div className="pt-4 flex justify-end">
          <div className="h-10 w-32 rounded-xl bg-brand-primary/40" />
        </div>
      </div>
    </div>
  );
}

