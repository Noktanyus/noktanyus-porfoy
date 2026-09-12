/**
 * Bireysel odaklı abonelik merdiveni.
 * Slug'lar onboarding / planGate ile uyumlu kalır: starter | pro | enterprise
 */

export const INDIVIDUAL_PLANS = [
  {
    slug: 'starter' as const,
    name: 'Bireysel',
    description: 'Tek kişi için kolay başlangıç. Hesabını aç, kullanmaya başla.',
    priceCents: 9900,
    currency: 'try',
    interval: 'MONTH' as const,
    stripePriceId: 'price_starter_mock',
    stripeProductId: 'prod_starter_mock',
    isFeatured: false,
    order: 1,
    trialDays: 14,
    marketing: [
      '1 kullanıcı',
      'Temel monitör & uyarı',
      'API erişimi (başlangıç kotası)',
      'E-posta destek',
      'İstediğin zaman iptal',
    ],
    limits: {
      aiTokensPerMonth: 10000,
      aiRequestsPerMonth: 50,
    },
  },
  {
    slug: 'pro' as const,
    name: 'Profesyonel',
    description: 'Daha yüksek kota ve öncelikli destek — solo veya küçük iş için.',
    priceCents: 29900,
    currency: 'try',
    interval: 'MONTH' as const,
    stripePriceId: 'price_pro_mock',
    stripeProductId: 'prod_pro_mock',
    isFeatured: true,
    order: 2,
    trialDays: 14,
    marketing: [
      '1–2 kullanıcı / workspace',
      'Yüksek API & AI kotası',
      'Öncelikli e-posta destek',
      'Daha fazla monitör',
      'Kolay yükseltme / iptal',
    ],
    limits: {
      aiTokensPerMonth: 100000,
      aiRequestsPerMonth: 500,
    },
  },
  {
    slug: 'enterprise' as const,
    name: 'Destek+',
    description: 'Kurulum yardımı ve danışmanlık — takıldığın yerde yanındayız.',
    priceCents: 49900,
    currency: 'try',
    interval: 'MONTH' as const,
    stripePriceId: 'price_enterprise_mock',
    stripeProductId: 'prod_enterprise_mock',
    isFeatured: false,
    order: 3,
    trialDays: 14,
    marketing: [
      'Profesyonel tüm özellikler',
      'Aylık danışmanlık saati',
      'Kurulum & entegrasyon yardımı',
      'Öncelikli yanıt',
      'Özel ihtiyaçlar için iletişim',
    ],
    // Destek+ → yüksek kota (planGate boş limits = sınırsız)
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
