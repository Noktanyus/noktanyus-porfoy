/**
 * Bireysel odaklı abonelik merdiveni — TR e-ticaret yardımcı API kotası.
 * Slug'lar onboarding / planGate ile uyumlu: starter | pro | enterprise
 */

export const INDIVIDUAL_PLANS = [
  {
    slug: 'starter' as const,
    name: 'Starter',
    description: 'TR yardımcı API: doğrulama, KDV/tevkifat, kıdem, iş günü, PDF.',
    priceCents: 9900,
    currency: 'try',
    interval: 'MONTH' as const,
    stripePriceId: 'price_1OtStarterLive001',
    stripeProductId: 'prod_1OtStarterLive001',
    isFeatured: false,
    order: 1,
    trialDays: 14,
    marketing: [
      '2.000 API isteği / ay',
      'VKN · IBAN · telefon · e-posta MX',
      'KDV + tevkifat · sayıdan yazıya',
      'E-posta destek',
      'İstediğin zaman iptal',
    ],
    limits: {
      apiRequestsPerMonth: 2000,
    },
  },
  {
    slug: 'pro' as const,
    name: 'Pro',
    description: 'Yüksek kota ve öncelikli destek — mağaza ve canlı entegrasyonlar için.',
    priceCents: 29900,
    currency: 'try',
    interval: 'MONTH' as const,
    stripePriceId: 'price_1OtProLive002',
    stripeProductId: 'prod_1OtProLive002',
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
    slug: 'business' as const,
    name: 'Business',
    description: 'Limitli üst segment: yoğun operasyonlar, e-ticaret platformları ve öncelikli SLA.',
    priceCents: 99900,
    currency: 'try',
    interval: 'MONTH' as const,
    stripePriceId: 'price_1OtBusinessLive003',
    stripeProductId: 'prod_1OtBusinessLive003',
    isFeatured: false,
    order: 3,
    trialDays: 14,
    marketing: [
      '50.000 API isteği / ay',
      'Öncelikli SLA & Hızlı Teknik Destek',
      'Gelişmiş webhook ve entegrasyon desteği',
      'Tüm API uçları + PDF fatura motoru',
      'İstediğin zaman iptal',
    ],
    limits: {
      apiRequestsPerMonth: 50000,
    },
  },
  {
    slug: 'enterprise' as const,
    name: 'Enterprise',
    description: 'Özel kota, SLA ve birebir mimari danışmanlık gerektiren kurumsal operasyonlar.',
    priceCents: 0,
    isCustomQuote: true,
    currency: 'try',
    interval: 'MONTH' as const,
    stripePriceId: 'price_enterprise_custom',
    stripeProductId: 'prod_enterprise_custom',
    isFeatured: false,
    order: 4,
    trialDays: 0,
    marketing: [
      'Özel belirlenen aylık API kotası',
      'Özel SLA & 7/24 Kesintisiz Destek',
      'Birebir danışmanlık & mimari kurulum desteği',
      'Özel sözleşme & kurumsal faturalama',
    ],
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
