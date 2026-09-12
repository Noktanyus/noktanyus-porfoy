/**
 * Mağaza katalog sabitleri — sanal ürün kategorileri + abonelik hizmet türleri.
 * Admin formları ve vitrin filtreleri bu listeyi kullanır.
 * (Category tablosu yok; DigitalProduct.category string alanına yazılır.)
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

/** Sanal ürün (tek seferlik) kategorileri */
export const PRODUCT_CATEGORIES: StoreCategoryOption[] = [
  {
    value: 'template',
    label: 'Template',
    description: 'Hazır proje / UI template’leri',
    channel: 'product',
  },
  {
    value: 'script',
    label: 'Script',
    description: 'Tek dosya veya küçük araç script’leri',
    channel: 'product',
  },
  {
    value: 'starter',
    label: 'Starter',
    description: 'Başlangıç kitleri ve iskelet projeler',
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
    label: 'Boilerplate',
    description: 'Çoklu katmanlı hazır iskelet',
    channel: 'product',
  },
  {
    value: 'api',
    label: 'API paketi',
    description: 'İndirmeli API örnekleri / SDK paketleri',
    channel: 'product',
  },
  {
    value: 'general',
    label: 'Genel',
    description: 'Diğer dijital ürünler',
    channel: 'product',
  },
];

/** Abonelik / aylık hizmet türleri (rehber) */
export const SUBSCRIPTION_SERVICE_TYPES = [
  {
    value: 'api_access',
    label: 'API erişimi',
    description: 'Bireysel kullanım için API key ve kota',
  },
  {
    value: 'monitoring',
    label: 'İzleme',
    description: 'Monitör, uyarı — kolay başlangıç',
  },
  {
    value: 'support',
    label: 'Destek+',
    description: 'Öncelikli destek ve kurulum yardımı',
  },
  {
    value: 'consulting',
    label: 'Danışmanlık',
    description: 'Aylık danışmanlık saati (Destek+)',
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
