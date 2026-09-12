'use client';

/**
 * TemplateCard — Vitrin ızgarasında gösterilen tek template kartı.
 *
 * Server Component olarak da kullanılabilir (framer-motion yok), ama hover
 * efektleri için 'use client' bırakıldı — parent grid Suspense fallback'i
 * ile skeleton gösterir.
 *
 * Ozellikler:
 *  - next/image (remotePatterns zaten next.config.mjs'te tanimli)
 *  - Tagline + kategori + tech stack rozetleri
 *  - Fiyat + lisans tipi badge
 *  - Hover scale + shadow efekti (group-hover)
 */

import Link from 'next/link';
import Image from 'next/image';
import { memo } from 'react';
import { FaArrowRight, FaStar } from 'react-icons/fa';
import { formatCurrency } from '@/lib/utils';

export interface TemplateCardData {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  category: string;
  previewImages: unknown; // JSON array — first element used as thumbnail
  priceCents: number;
  currency: string;
  licenseType: string;
  techStack: unknown; // JSON array
  rating: number | null;
  reviewCount: number;
  featured: boolean;
  version: string;
}

interface TemplateCardProps {
  template: TemplateCardData;
  index?: number;
}

const LICENSE_LABELS: Record<string, string> = {
  single: 'Tek Site',
  'white-label': 'White Label',
  agency: 'Ajans',
};

function pickStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v): v is string => typeof v === 'string')
    .map((v) => v.trim())
    .filter(Boolean);
}

function pickFirstImage(value: unknown): string | null {
  const arr = pickStringArray(value);
  return arr.length > 0 ? arr[0] : null;
}

const TemplateCard = memo(function TemplateCard({ template, index = 0 }: TemplateCardProps) {
  const thumbnail = pickFirstImage(template.previewImages);
  const techs = pickStringArray(template.techStack).slice(0, 3);
  const licenseLabel = LICENSE_LABELS[template.licenseType] ?? template.licenseType;

  return (
    <article
      className="group glass-card-premium h-full flex flex-col animate-fade-in relative overflow-hidden"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Thumbnail */}
      <div className="relative h-48 sm:h-52 overflow-hidden bg-muted">
        {thumbnail ? (
          <Image
            src={thumbnail}
            alt={`${template.name} için küçük resim`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
            quality={80}
            loading="lazy"
          />
        ) : (
          <div
            className="flex items-center justify-center h-full text-muted-foreground text-sm"
            aria-label="Görsel yok"
          >
            <span aria-hidden="true">🎨</span>
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-90 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Category badge */}
        <div className="absolute top-3 left-3 z-10">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase glass-badge-overlay">
            {template.category}
          </span>
        </div>

        {/* Featured badge */}
        {template.featured && (
          <div className="absolute top-3 right-3 z-10">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500 text-white shadow-lg">
              <FaStar className="w-3 h-3" aria-hidden="true" />
              Öne Çıkan
            </span>
          </div>
        )}

        {/* Title overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
          <h3 className="text-lg font-bold text-white leading-tight line-clamp-2 drop-shadow-md">
            {template.name}
          </h3>
          <p className="text-sm text-white/90 line-clamp-1 mt-1 drop-shadow">
            {template.tagline}
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="p-5 flex-grow flex flex-col min-w-0">
        {/* Tech stack */}
        {techs.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {techs.map((tech) => (
              <span
                key={tech}
                className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 max-w-full truncate"
              >
                {tech}
              </span>
            ))}
            {pickStringArray(template.techStack).length > 3 && (
              <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500">
                +{pickStringArray(template.techStack).length - 3}
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-auto pt-3 border-t border-gray-200/60 dark:border-gray-700/60 flex items-center justify-between gap-2">
          <div className="flex flex-col min-w-0">
            <span className="text-lg font-bold text-brand-primary tabular-nums break-words">
              {formatCurrency(template.priceCents, template.currency)}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {licenseLabel} · v{template.version}
            </span>
          </div>
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-primary group-hover:gap-2.5 transition-all duration-300 shrink-0">
            İncele
            <FaArrowRight className="w-3 h-3 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
          </span>
        </div>

        {/* Rating */}
        {template.rating !== null && template.reviewCount > 0 && (
          <div
            className="absolute top-3 right-3 z-20 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 text-white text-xs"
            aria-label={`${template.rating} yıldız, ${template.reviewCount} yorum`}
          >
            <FaStar className="w-3 h-3 text-amber-400" aria-hidden="true" />
            <span className="tabular-nums">{template.rating.toFixed(1)}</span>
            <span className="text-white/70">({template.reviewCount})</span>
          </div>
        )}
      </div>

      {/* Full card link */}
      <Link
        href={`/marketplace/${template.slug}`}
        className="absolute inset-0 z-30"
        aria-label={`${template.name} detayını görüntüle`}
      >
        <span className="sr-only">Detayı gör</span>
      </Link>
    </article>
  );
});

export default TemplateCard;
export { TemplateCard };