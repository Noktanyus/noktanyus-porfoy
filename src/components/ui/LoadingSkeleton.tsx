"use client";

/**
 * @file LoadingSkeleton - Tüm sayfalar için tutarlı iskelet yükleme ekranı
 */

interface SkeletonProps {
  variant?: "blog" | "project" | "detail" | "list";
  count?: number;
  className?: string;
}

export function LoadingSkeleton({ variant = "list", count = 1, className = "" }: SkeletonProps) {
  const items = Array.from({ length: count }, (_, i) => i);

  if (variant === "blog") {
    return (
      <div className={`grid md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 ${className}`}>
        {items.map((i) => (
          <div key={i} className="glass-card-premium overflow-hidden animate-pulse">
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
      <div className={`space-y-6 ${className}`}>
        {items.map((i) => (
          <div key={i} className="glass-card-premium overflow-hidden flex flex-col lg:flex-row animate-pulse">
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
      <div className={`max-w-4xl mx-auto space-y-6 ${className}`}>
        <div className="glass-card-premium p-8 space-y-4 animate-pulse">
          <div className="h-10 bg-gray-200/50 dark:bg-gray-700/30 rounded-lg w-3/4" />
          <div className="h-5 bg-gray-200/50 dark:bg-gray-700/30 rounded w-1/2" />
          <div className="flex gap-3 pt-2">
            <div className="h-7 w-24 bg-gray-200/50 dark:bg-gray-700/30 rounded-full" />
            <div className="h-7 w-24 bg-gray-200/50 dark:bg-gray-700/30 rounded-full" />
          </div>
        </div>
        <div className="h-72 sm:h-96 glass-card-premium rounded-2xl bg-gray-200/50 dark:bg-gray-700/30" />
        <div className="glass-card-premium p-8 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-4 bg-gray-200/50 dark:bg-gray-700/30 rounded" 
                 style={{ width: i === 4 ? "75%" : i === 2 ? "85%" : "100%" }} />
          ))}
        </div>
      </div>
    );
  }

  // Default: list variant
  return (
    <div className={`space-y-8 ${className}`}>
      <div className="flex flex-col items-center gap-5">
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
export function PageSkeleton({ variant = "list" }: { variant?: "blog" | "project" | "detail" }) {
  return (
    <div className="section-glass-hero bg-blob-decoration">
      <div className="relative z-10 space-y-8">
        <div className="text-center mb-8 sm:mb-12">
          <div className="h-14 w-64 mx-auto glass-card-premium rounded-full animate-pulse mb-4" />
          <div className="h-6 w-96 mx-auto glass-card-premium rounded-lg animate-pulse" />
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
    <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
      <div className="w-12 h-12 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin" />
      <p className="text-gray-500 dark:text-gray-400 font-medium">{text}</p>
    </div>
  );
}