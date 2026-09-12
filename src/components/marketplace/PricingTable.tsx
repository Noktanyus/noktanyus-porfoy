'use client';

/**
 * PricingTable — 3 lisans tipi için fiyatlandırma karşılaştırma tablosu.
 *
 * Tek/white-label/agency lisansları için ayrı sütunlar.
 * Her sütun kendi fiyatı + "Buy Now" CTA'sı barındırır.
 * "white-label" sütunu varsayılan olarak "ÖNERİLEN" rozeti alır.
 */

import Link from 'next/link';
import { FaCheck, FaCrown } from 'react-icons/fa';
import { formatCurrency } from '@/lib/utils';

export interface PricingTier {
  type: string; // "single" | "white-label" | "agency"
  label: string; // "Tek Site"
  priceCents: number;
  currency: string;
  description: string;
  features: string[];
  highlight?: boolean; // "recommended"
  ctaLabel?: string;
}

interface PricingTableProps {
  templateSlug: string;
  basePriceCents: number;
  currency: string;
  /** Detay sayfasından gelen features listesi (her tier'a eklenir) */
  sharedFeatures?: string[];
}

const TIER_MULTIPLIERS: Record<string, number> = {
  single: 1,
  'white-label': 3,
  agency: 6,
};

const TIER_DESCRIPTIONS: Record<string, string> = {
  single: 'Tek bir proje için kişisel kullanım.',
  'white-label': 'Marka değiştirme hakkı ile sınırsız projeler.',
  agency: 'Ajans/müşteri teslimleri için tam yetki.',
};

const TIER_CTA: Record<string, string> = {
  single: 'Tek Lisans Al',
  'white-label': 'White Label Al',
  agency: 'Ajans Lisansı Al',
};

const TIER_FEATURES: Record<string, string[]> = {
  single: [
    'Tek proje kullanımı',
    '6 ay güncelleme',
    'Topluluk desteği',
  ],
  'white-label': [
    'Sınırsız proje kullanımı',
    'Marka değiştirme (white-label)',
    '12 ay güncelleme',
    'Öncelikli e-posta desteği',
  ],
  agency: [
    'Sınırsız proje + müşteri teslimi',
    'White-label + özel domain',
    'Ömür boyu güncelleme',
    'Öncelikli destek (24 saat)',
    'Kaynak kod erişimi',
  ],
};

export function PricingTable({
  templateSlug,
  basePriceCents,
  currency,
  sharedFeatures = [],
}: PricingTableProps) {
  const tiers: PricingTier[] = (['single', 'white-label', 'agency'] as const).map((type) => {
    const multiplier = TIER_MULTIPLIERS[type] ?? 1;
    const tierFeatures = [...TIER_FEATURES[type], ...sharedFeatures];

    return {
      type,
      label:
        type === 'single' ? 'Tek Site' : type === 'white-label' ? 'White Label' : 'Ajans',
      priceCents: basePriceCents * multiplier,
      currency,
      description: TIER_DESCRIPTIONS[type] ?? '',
      features: tierFeatures,
      highlight: type === 'white-label',
      ctaLabel: TIER_CTA[type] ?? 'Satın Al',
    };
  });

  return (
    <div
      className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6"
      role="list"
      aria-label="Lisans seçenekleri"
    >
      {tiers.map((tier) => (
        <article
          key={tier.type}
          role="listitem"
          className={`relative glass-card-premium p-6 flex flex-col min-w-0 ${
            tier.highlight
              ? 'ring-2 ring-brand-primary shadow-xl md:-translate-y-2'
              : ''
          }`}
        >
          {tier.highlight && (
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-brand-primary text-white text-xs font-bold shadow-lg">
              <FaCrown className="w-3 h-3" aria-hidden="true" />
              ÖNERİLEN
            </span>
          )}

          <header className="mb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 break-words">
              {tier.label}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 break-words">
              {tier.description}
            </p>
          </header>

          <div className="mb-5 flex items-baseline gap-2">
            <span
              className={`text-3xl font-bold tabular-nums break-words ${
                tier.highlight ? 'text-brand-primary' : 'text-gray-900 dark:text-white'
              }`}
            >
              {formatCurrency(tier.priceCents, tier.currency)}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">/ lisans</span>
          </div>

          <ul className="space-y-2 mb-6 text-sm flex-1">
            {tier.features.map((feature, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2 text-gray-700 dark:text-gray-300"
              >
                <FaCheck
                  className={`w-4 h-4 mt-0.5 shrink-0 ${
                    tier.highlight ? 'text-brand-primary' : 'text-green-500'
                  }`}
                  aria-hidden="true"
                />
                <span className="min-w-0 break-words">{feature}</span>
              </li>
            ))}
          </ul>

          <Link
            href={`/marketplace/${templateSlug}/checkout?type=${tier.type}`}
            className={`w-full inline-flex items-center justify-center min-h-[48px] px-6 py-3 rounded-xl text-base font-bold transition-all duration-300 ${
              tier.highlight
                ? 'bg-brand-primary text-white hover:bg-brand-primary/90 shadow-lg'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
            }`}
            aria-label={`${tier.label} lisansını satın al`}
          >
            {tier.ctaLabel}
          </Link>
        </article>
      ))}
    </div>
  );
}

export default PricingTable;