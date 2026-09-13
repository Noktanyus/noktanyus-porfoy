/**
 * Mağaza katalog sabitleri.
 * Vitrin birincil teklifi: TR yardımcı API — aylık plan (Bireysel/Profesyonel) + ön ödemeli kredi.
 * Sanal ürün kategorileri ikincil "hazır paket" kanalını besler; backend tipleri korunur.
 */

export type ProductCategoryValue =
  | 'template'
  | 'script'
  | 'starter'
  | 'library'
  | 'boilerplate'
  | 'api'
  | 'general';

export interface StoreCategoryOption {
  value: ProductCategoryValue;
  label: string;
  description: string;
  channel: 'product' | 'subscription';
}

/**
 * Hazır paket (tek seferlik, indirmeli) kategorileri — ikincil kanal.
 * Hiçbiri API kotası içermez; API erişimi plan veya kredi ile satılır.
 */
export const PRODUCT_CATEGORIES: StoreCategoryOption[] = [
  {
    value: 'template',
    label: 'Şablon',
    description: 'Hazır proje / UI şablonu — indirilir, API kotası yok',
    channel: 'product',
  },
  {
    value: 'script',
    label: 'Script',
    description: 'Tek dosya veya küçük araç script’i',
    channel: 'product',
  },
  {
    value: 'starter',
    label: 'Başlangıç kiti',
    description: 'Ödeme / mağaza kurulumu için başlangıç kiti',
    channel: 'product',
  },
  {
    value: 'library',
    label: 'Kütüphane',
    description: 'Yeniden kullanılabilir paket / lib',
    channel: 'product',
  },
  {
    value: 'boilerplate',
    label: 'İskelet proje',
    description: 'Çoklu katmanlı hazır proje iskeleti',
    channel: 'product',
  },
  {
    value: 'api',
    label: 'SDK paketi',
    description: 'İndirmeli SDK / örnek entegrasyon — API kotası ayrı satılır',
    channel: 'product',
  },
  {
    value: 'general',
    label: 'Genel',
    description: 'Diğer dijital paketler',
    channel: 'product',
  },
];

/**
 * Abonelik hizmet türleri — vitrin sırası birincil teklifi yansıtır.
 * api_access + api_credits ana teklif; support/consulting ek hizmettir.
 */
export const SUBSCRIPTION_SERVICE_TYPES = [
  {
    value: 'api_access',
    label: 'TR yardımcı API planı',
    description:
      'Ana teklif — API key + aylık sabit kota (Bireysel 1.000 / Profesyonel 10.000 istek)',
  },
  {
    value: 'api_credits',
    label: 'API kredisi',
    description: 'Ana teklif — ön ödemeli bakiye, 1 kredi = 1 istek, aboneliksiz',
  },
  {
    value: 'support',
    label: 'Destek+',
    description: 'Ek hizmet — öncelikli destek ve kurulum yardımı',
  },
  {
    value: 'consulting',
    label: 'Danışmanlık',
    description: 'Ek hizmet — aylık danışmanlık saati (Destek+)',
  },
] as const;

const PRODUCT_LABEL_MAP = Object.fromEntries(
  PRODUCT_CATEGORIES.map((c) => [c.value, c.label])
) as Record<string, string>;

export function productCategoryLabel(value: string | null | undefined): string {
  if (!value) return 'Genel';
  return PRODUCT_LABEL_MAP[value.toLowerCase()] ?? value;
}

export function isKnownProductCategory(value: string): value is ProductCategoryValue {
  return PRODUCT_CATEGORIES.some((c) => c.value === value);
}
