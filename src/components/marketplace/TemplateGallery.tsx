'use client';

/**
 * TemplateGallery — Template kartlarından oluşan grid wrapper.
 *
 * - Server'dan gelen template listesi map edilir
 * - Boş durumda EmptyState gösterilir
 * - SkeletonCard placeholder'ı gridLayout ile uyumlu
 */

import { TemplateCard, TemplateCardData } from './TemplateCard';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { EmptyState } from '@/components/ui/EmptyState';

interface TemplateGalleryProps {
  templates: TemplateCardData[];
  /** Loading state — true ise skeleton grid gösterilir */
  loading?: boolean;
  /** Skeleton grid sayısı (default 6) */
  skeletonCount?: number;
}

export function TemplateGallery({
  templates,
  loading = false,
  skeletonCount = 6,
}: TemplateGalleryProps) {
  if (loading) {
    return (
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        role="status"
        aria-busy="true"
        aria-label="Template listesi yükleniyor"
      >
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <SkeletonCard key={i} imageHeightClass="h-48" lines={2} />
        ))}
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <EmptyState
        title="Template bulunamadı"
        description="Aradığınız kriterlere uygun template yok. Filtreleri değiştirip tekrar deneyin."
        icon="🗂️"
      />
    );
  }

  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
      role="list"
      aria-label="Template vitrini"
    >
      {templates.map((template, idx) => (
        <div key={template.id} role="listitem">
          <TemplateCard template={template} index={idx} />
        </div>
      ))}
    </div>
  );
}

export default TemplateGallery;