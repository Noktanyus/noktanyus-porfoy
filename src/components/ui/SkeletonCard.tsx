'use client';

/**
 * @file SkeletonCard - Tek kart için shimmer destekli skeleton bileşeni.
 *
 * LoadingSkeleton ile birlikte kullanılabilir; her kart bağımsız
 * shimmer pulse animasyonu yapar.
 */

interface SkeletonProps {
  className?: string;
  /** Satır sayısı (varsayılan 2) */
  lines?: number;
  /** Görsel alanı yüksekliği (Tailwind class) */
  imageHeightClass?: string;
}

export function SkeletonCard({
  className = '',
  lines = 2,
  imageHeightClass = 'h-48',
}: SkeletonProps) {
  return (
    <div className={`glass-card-premium p-6 ${className}`} aria-hidden="true">
      <div className="animate-pulse space-y-4">
        <div className={`${imageHeightClass} bg-muted rounded-lg shimmer`} />
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="h-4 bg-muted rounded shimmer"
            style={{ width: i === lines - 1 ? '60%' : '80%' }}
          />
        ))}
        <div className="flex gap-2">
          <div className="h-6 w-16 bg-muted rounded-full shimmer" />
          <div className="h-6 w-16 bg-muted rounded-full shimmer" />
        </div>
      </div>
    </div>
  );
}

export default SkeletonCard;
