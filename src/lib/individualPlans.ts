/**
 * Bireysel odaklı abonelik merdiveni — TR e-ticaret yardımcı API kotası.
 * Slug'lar onboarding / planGate ile uyumlu: starter | pro | enterprise
 */

export const INDIVIDUAL_PLANS = [
  {
    slug: 'starter' as const,
    name: 'Bireysel',
    description: 'TR yardımcı API: doğrulama, KDV/tevkifat, kıdem, iş günü, PDF.',
    priceCents: 9900,
    currency: 'try',
    interval: 'MONTH' as const,
    stripePriceId: 'price_starter_mock',
    stripeProductId: 'prod_starter_mock',
    isFeatured: false,
    order: 1,
    trialDays: 14,
    marketing: [
      '1.000 API isteği / ay',
      'VKN · IBAN · telefon · e-posta MX',
      'KDV + tevkifat · sayıdan yazıya',
      'E-posta destek',
      'İstediğin zaman iptal',
    ],
    limits: {
      apiRequestsPerMonth: 1000,
    },
  },
  {
    slug: 'pro' as const,
    name: 'Profesyonel',
    description: 'Yüksek kota ve öncelikli destek — mağaza / entegrasyon için.',
    priceCents: 29900,
    currency: 'try',
    interval: 'MONTH' as const,
    stripePriceId: 'price_pro_mock',
    stripeProductId: 'prod_pro_mock',
    isFeatured: true,
    order: 2,
    trialDays: 14,
    marketing: [
      '10.000 API isteği / ay',
      'Kıdem/ihbar + iş günü takvimi',
      'Tüm doğrulama + tevkifat + PDF',
      'Öncelikli e-posta destek',
      'Kolay yükseltme / iptal',
    ],
    limits: {
      apiRequestsPerMonth: 10000,
    },
  },
  {
    slug: 'enterprise' as const,
    name: 'Destek+',
    description: 'Sınırsız kota + kurulum yardımı ve danışmanlık.',
    priceCents: 49900,
    currency: 'try',
    interval: 'MONTH' as const,
    stripePriceId: 'price_enterprise_mock',
    stripeProductId: 'prod_enterprise_mock',
    isFeatured: false,
    order: 3,
    trialDays: 14,
    marketing: [
      'Sınırsız API isteği',
      'Profesyonel tüm özellikler',
      'Aylık danışmanlık saati',
      'Kurulum & entegrasyon yardımı',
      'Öncelikli yanıt',
    ],
    // Destek+ → sınırsız (planGate Infinity)
    limits: {} as Record<string, never>,
  },
] as const;

export type IndividualPlanSlug = (typeof INDIVIDUAL_PLANS)[number]['slug'];

export function intervalLabel(interval: string): string {
  switch (interval.toUpperCase()) {
    case 'MONTH':
      return 'ay';
    case 'YEAR':
      return 'yıl';
    default:
      return interval.toLowerCase();
  }
}
