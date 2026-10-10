/**
 * Türkiye E-Ticaret Pazaryeri Komisyon & Kâr Hesaplama Motoru
 *
 * Trendyol, Hepsiburada, Amazon TR ve N11 platformları için:
 * - Kategori bazlı referans komisyon oranları
 * - Desi bazlı kargo barem ücretleri
 * - KDV, platform hizmet bedeli, stopaj (%1) ve paketleme giderleri
 * - Net kâr, kâr marjı ve ROI hesaplaması
 */

export type MarketplacePlatform = 'trendyol' | 'hepsiburada' | 'amazon_tr' | 'n11';

export interface MarketplacePlatformInfo {
  id: MarketplacePlatform;
  name: string;
  defaultServiceFee: number; // KDV dahil işlem/hizmet bedeli (TL)
  commissionVatRate: number; // Komisyon faturası KDV oranı (genelde %20)
}

export const PLATFORMS: Record<MarketplacePlatform, MarketplacePlatformInfo> = {
  trendyol: {
    id: 'trendyol',
    name: 'Trendyol',
    defaultServiceFee: 8.49,
    commissionVatRate: 20,
  },
  hepsiburada: {
    id: 'hepsiburada',
    name: 'Hepsiburada',
    defaultServiceFee: 7.99,
    commissionVatRate: 20,
  },
  amazon_tr: {
    id: 'amazon_tr',
    name: 'Amazon Türkiye',
    defaultServiceFee: 0,
    commissionVatRate: 20,
  },
  n11: {
    id: 'n11',
    name: 'N11',
    defaultServiceFee: 6.99,
    commissionVatRate: 20,
  },
};

export interface MarketplaceCategory {
  id: string;
  name: string;
  commissionRates: Record<MarketplacePlatform, number>; // Yüzde (%)
}

export const MARKETPLACE_CATEGORIES: MarketplaceCategory[] = [
  {
    id: 'giyim_moda',
    name: 'Giyim & Moda & Ayakkabı',
    commissionRates: { trendyol: 21, hepsiburada: 20, amazon_tr: 15, n11: 19 },
  },
  {
    id: 'elektronik_aksesuar',
    name: 'Elektronik Aksesuar & Kılıf',
    commissionRates: { trendyol: 22, hepsiburada: 20, amazon_tr: 15, n11: 20 },
  },
  {
    id: 'elektronik_cihaz',
    name: 'Bilgisayar & Telefon & Beyaz Eşya',
    commissionRates: { trendyol: 8, hepsiburada: 7.5, amazon_tr: 7, n11: 8 },
  },
  {
    id: 'kozmetik_kisisel_bakim',
    name: 'Kozmetik & Kişisel Bakım',
    commissionRates: { trendyol: 17, hepsiburada: 16.5, amazon_tr: 13, n11: 16 },
  },
  {
    id: 'ev_yasam_dekorasyon',
    name: 'Ev & Yaşam & Mutfak & Mobilya',
    commissionRates: { trendyol: 19, hepsiburada: 18, amazon_tr: 14, n11: 18 },
  },
  {
    id: 'anne_bebek',
    name: 'Anne & Bebek & Çocuk',
    commissionRates: { trendyol: 16, hepsiburada: 15.5, amazon_tr: 13, n11: 15 },
  },
  {
    id: 'spor_outdoor',
    name: 'Spor & Outdoor & Fitness',
    commissionRates: { trendyol: 17, hepsiburada: 16, amazon_tr: 14, n11: 16 },
  },
  {
    id: 'oto_yapi_market',
    name: 'Otomotiv & Yapı Market & Hırdavat',
    commissionRates: { trendyol: 16, hepsiburada: 15, amazon_tr: 13, n11: 15 },
  },
  {
    id: 'kitap_hobi_kirtasiye',
    name: 'Kitap & Müzik & Hobi & Kırtasiye',
    commissionRates: { trendyol: 15, hepsiburada: 14, amazon_tr: 12, n11: 14 },
  },
  {
    id: 'petshop_evcil_hayvan',
    name: 'Pet Shop & Evcil Hayvan Ürünleri',
    commissionRates: { trendyol: 15, hepsiburada: 15, amazon_tr: 12, n11: 15 },
  },
];

/**
 * Ortalama platform anlaşmalı kargo barem tablosu (KDV dahil TL)
 */
export function estimatePlatformCargoCost(desi: number): number {
  if (desi <= 1) return 42.5;
  if (desi <= 2) return 49.0;
  if (desi <= 5) return 62.0;
  if (desi <= 10) return 85.0;
  if (desi <= 15) return 115.0;
  if (desi <= 20) return 145.0;
  return 145.0 + (desi - 20) * 6.5;
}

export interface MarketplaceFeeInput {
  platform?: MarketplacePlatform;
  salePrice: number; // Müşteri satış fiyatı (TL, KDV dahil)
  purchasePrice?: number; // Ürün alış / üretim maliyeti (TL, KDV dahil, varsayılan: 0)
  categoryId?: string; // Seçili kategori ID
  customCommissionRate?: number; // Manuel girilen komisyon oranı (%)
  cargoDesi?: number; // Kargo desisi (yoksa cargoCost kullanılır)
  cargoCost?: number; // Özel kargo maliyeti (TL)
  serviceFee?: number; // Hizmet bedeli (TL, yoksa platform varsayılanı)
  packagingCost?: number; // Ambalaj, kutu ve koli maliyeti (TL)
  applyWithholding?: boolean; // E-ticaret tevkifat stopajı (%1 GVK m.94) uygulansın mı? (varsayılan: false)
}

export interface MarketplaceFeeResult {
  platform: MarketplacePlatform;
  platformName: string;
  salePrice: number;
  purchasePrice: number;
  commissionRate: number;
  commissionAmount: number;
  commissionVat: number;
  totalCommissionWithVat: number;
  serviceFee: number;
  cargoCost: number;
  packagingCost: number;
  withholdingAmount: number;
  totalDeductions: number;
  totalCostWithPurchase: number;
  netPayoutFromPlatform: number;
  netProfit: number;
  profitMarginPercent: number; // Net Kâr / Satış Fiyatı * 100
  roiPercent: number; // Net Kâr / (Alış + Giderler) * 100
  isProfitable: boolean;
  breakdownSummary: string;
}

/**
 * Pazaryeri net kâr ve komisyon maliyetini kuruş hassasiyetinde hesaplar
 */
export function calculateMarketplaceFee(input: MarketplaceFeeInput): MarketplaceFeeResult {
  const platform = input.platform ?? 'trendyol';
  const platformInfo = PLATFORMS[platform] ?? PLATFORMS.trendyol;
  const salePrice = Math.max(0, input.salePrice);
  const purchasePrice = Math.max(0, input.purchasePrice ?? 0);

  // Komisyon oranı tespiti
  let commissionRate = 15;
  if (input.customCommissionRate !== undefined && input.customCommissionRate >= 0) {
    commissionRate = input.customCommissionRate;
  } else if (input.categoryId) {
    const cat = MARKETPLACE_CATEGORIES.find((c) => c.id === input.categoryId);
    if (cat && cat.commissionRates[platform]) {
      commissionRate = cat.commissionRates[platform];
    }
  }

  // Komisyon tutarı ve KDV
  const rawCommission = (salePrice * commissionRate) / 100;
  const commissionAmount = Math.round(rawCommission * 100) / 100;
  const commissionVat = Math.round(((commissionAmount * platformInfo.commissionVatRate) / 100) * 100) / 100;
  const totalCommissionWithVat = Math.round((commissionAmount + commissionVat) * 100) / 100;

  // Platform hizmet bedeli
  const serviceFee =
    input.serviceFee !== undefined ? Math.max(0, input.serviceFee) : platformInfo.defaultServiceFee;

  // Kargo maliyeti
  let cargoCost = 0;
  if (input.cargoCost !== undefined && input.cargoCost >= 0) {
    cargoCost = input.cargoCost;
  } else if (input.cargoDesi !== undefined && input.cargoDesi >= 0) {
    cargoCost = estimatePlatformCargoCost(input.cargoDesi);
  }

  const packagingCost = Math.max(0, input.packagingCost || 0);

  // Stopaj (%1 e-ticaret aracı hizmet sağlayıcı tevkifatı)
  const withholdingAmount = input.applyWithholding
    ? Math.round((salePrice * 0.01) * 100) / 100
    : 0;

  // Pazaryerinin satıcıya yapacağı net hak ediş ödemesi (Satış - Komisyon - Kargo - Hizmet - Stopaj)
  const platformDeductions = Math.round(
    (totalCommissionWithVat + cargoCost + serviceFee + withholdingAmount) * 100
  ) / 100;

  const netPayoutFromPlatform = Math.round((salePrice - platformDeductions) * 100) / 100;

  // Toplam tüm maliyetler (Alış maliyeti + platform kesintileri + paketleme)
  const totalDeductions = Math.round((platformDeductions + packagingCost) * 100) / 100;
  const totalCostWithPurchase = Math.round((purchasePrice + totalDeductions) * 100) / 100;

  // Net Cebe Kalan Kâr
  const netProfit = Math.round((salePrice - totalCostWithPurchase) * 100) / 100;

  // Kâr Marjı (Net Kâr / Satış Fiyatı)
  const profitMarginPercent =
    salePrice > 0 ? Math.round(((netProfit / salePrice) * 100) * 100) / 100 : 0;

  // ROI (Net Kâr / Toplam Yatırılan Maliyet)
  const totalInvested = purchasePrice + packagingCost;
  const roiPercent =
    totalInvested > 0 ? Math.round(((netProfit / totalInvested) * 100) * 100) / 100 : 0;

  const isProfitable = netProfit > 0;

  const breakdownSummary = `${platformInfo.name} Satış: ₺${salePrice.toFixed(2)} | Komisyon: ₺${totalCommissionWithVat.toFixed(2)} (%${commissionRate} + KDV) | Kargo: ₺${cargoCost.toFixed(2)} | Ürün Alış: ₺${purchasePrice.toFixed(2)} | Net Kâr: ₺${netProfit.toFixed(2)} (%${profitMarginPercent})`;

  return {
    platform,
    platformName: platformInfo.name,
    salePrice,
    purchasePrice,
    commissionRate,
    commissionAmount,
    commissionVat,
    totalCommissionWithVat,
    serviceFee,
    cargoCost,
    packagingCost,
    withholdingAmount,
    totalDeductions,
    totalCostWithPurchase,
    netPayoutFromPlatform,
    netProfit,
    profitMarginPercent,
    roiPercent,
    isProfitable,
    breakdownSummary,
  };
}
