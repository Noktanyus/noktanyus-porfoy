'use client';

/**
 * TemplateHero — Template detay sayfasının üst hero bölümü.
 *
 * - Kategori badge + öne çıkan yıldızı
 * - İsim (h1) + tagline
 * - Tech stack rozetleri
 * - Rating + version + download count istatistikleri
 * - "Canlı Demo" CTA (demoUrl varsa) + "Satın Al" CTA
 */

import Link from 'next/link';
import { FaArrowRight, FaPlay, FaStar, FaDownload, FaCodeBranch } from 'react-icons/fa';
import { formatCurrency } from '@/lib/utils';

interface TemplateHeroProps {
  slug: string;
  name: string;
  tagline: string;
  category: string;
  techStack: string[];
  rating: number | null;
  reviewCount: number;
  downloads: number;
  version: string;
  priceCents: number;
  currency: string;
  licenseType: string;
  demoUrl?: string | null;
  featured: boolean;
}

const LICENSE_LABELS: Record<string, string> = {
  single: 'Tek Site Lisansı',
  'white-label': 'White Label',
  agency: 'Ajans Lisansı',
};

export function TemplateHero({
  slug,
  name,
  tagline,
  category,
  techStack,
  rating,
  reviewCount,
  downloads,
  version,
  priceCents,
  currency,
  licenseType,
  demoUrl,
  featured,
}: TemplateHeroProps) {
  const licenseLabel = LICENSE_LABELS[licenseType] ?? licenseType;

  return (
    <section className="glass-card-premium p-6 sm:p-8 mb-8" aria-labelledby="template-title">
      {/* Top badges */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase bg-brand-primary/10 text-brand-primary">
          {category}
        </span>
        {featured && (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-500 text-white">
            <FaStar className="w-3 h-3" aria-hidden="true" />
            Öne Çıkan
          </span>
        )}
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
          v{version}
        </span>
      </div>

      {/* Title + tagline */}
      <h1
        id="template-title"
        className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-3 break-words"
      >
        {name}
      </h1>
      <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 mb-6 break-words max-w-3xl">
        {tagline}
      </p>

      {/* Stats row */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-gray-600 dark:text-gray-400 mb-6">
        {rating !== null && reviewCount > 0 && (
          <span
            className="inline-flex items-center gap-1.5"
            aria-label={`${rating} yıldız, ${reviewCount} değerlendirme`}
          >
            <FaStar className="w-4 h-4 text-amber-500" aria-hidden="true" />
            <strong className="text-gray-900 dark:text-white tabular-nums">{rating.toFixed(1)}</strong>
            <span className="tabular-nums">({reviewCount} değerlendirme)</span>
          </span>
        )}
        <span className="inline-flex items-center gap-1.5">
          <FaDownload className="w-4 h-4" aria-hidden="true" />
          <strong className="text-gray-900 dark:text-white tabular-nums">
            {downloads.toLocaleString('tr-TR')}
          </strong>{' '}
          indirme
        </span>
        <span className="inline-flex items-center gap-1.5">
          <FaCodeBranch className="w-4 h-4" aria-hidden="true" />
          {licenseLabel}
        </span>
      </div>

      {/* Tech stack */}
      {techStack.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6" aria-label="Teknoloji yığını">
          {techStack.slice(0, 8).map((tech) => (
            <span
              key={tech}
              className="px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium"
            >
              {tech}
            </span>
          ))}
          {techStack.length > 8 && (
            <span className="px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 text-sm">
              +{techStack.length - 8}
            </span>
          )}
        </div>
      )}

      {/* Price + CTAs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-6 border-t border-gray-200/60 dark:border-gray-700/60">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Başlangıç fiyatı</p>
          <p className="text-3xl sm:text-4xl font-bold text-brand-primary tabular-nums break-words">
            {formatCurrency(priceCents, currency)}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:shrink-0">
          {demoUrl && (
            <Link
              href={`/marketplace/${slug}/demo`}
              className="inline-flex items-center justify-center gap-2 min-h-[48px] px-6 py-3 rounded-xl border-2 border-brand-primary text-brand-primary bg-transparent hover:bg-brand-primary/10 font-semibold transition-colors"
            >
              <FaPlay className="w-4 h-4" aria-hidden="true" />
              Canlı Demo
            </Link>
          )}
          <Link
            href={`/marketplace/${slug}#pricing`}
            className="inline-flex items-center justify-center gap-2 min-h-[48px] px-6 py-3 rounded-xl bg-brand-primary text-white hover:bg-brand-primary/90 font-bold shadow-lg transition-colors"
          >
            Satın Al
            <FaArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}

export default TemplateHero;