/**
 * @file Türkiye E-Ticaret İade Oranı, Zarar & Efektif Kârlılık Hesaplama Motoru
 * @description Trendyol, Hepsiburada, Amazon TR ve kendi e-ticaret sitelerinde
 *              satış yapan tüccarlar için iade kaynaklı gizli maliyetleri,
 *              birim iade zararını, efektif kârı ve başa baş iade limitini hesaplar.
 */

export interface ReturnLossInput {
  /** Satış Fiyatı (KDV Dahil, TL) */
  salePrice: number;
  /** Ürün Alış / Maliyet Fiyatı (KDV Dahil, TL) */
  costPrice: number;
  /** Pazaryeri Komisyon Oranı (%) */
  commissionRate: number;
  /** KDV Oranı (%) - ör. 10 veya 20 */
  vatRate?: number;
  /** Beklenen / Gerçekleşen İade Oranı (%) - ör. 20 */
  returnRate: number;
  /** Gidiş Kargo Maliyeti (TL) */
  shippingOutboundCost: number;
  /** İade Dönüş Kargo Maliyeti (TL) */
  shippingReturnCost: number;
  /** Ambalaj, koli ve paketleme sarf malzeme maliyeti (TL) */
  packagingCost?: number;
  /** İade edilen ürünün yıpranma, kutu hasarı veya değer kaybı oranı (%) - ör. 5 */
  damagedLossRate?: number;
  /** Pazaryeri iade işlem / hizmet kesintisi (varsa, TL) */
  marketplaceReturnFee?: number;
  /** Aylık Toplam Satış Adedi (Opsiyonel projeksiyon için) */
  monthlyOrderCount?: number;
}

export interface ReturnLossResult {
  /** Başarılı (iadesiz) tamamlanan sipariş başına net kâr (TL) */
  successfulNetProfit: number;
  /** Başarılı satış kâr marjı (%) */
  successfulProfitMarginPercent: number;
  /** İade edilen TEK bir siparişin satıcıya doğrudan net zararı (TL) */
  singleReturnDirectLoss: number;
  /** İade oranı hesaba katıldığında sipariş başına EFEKTİF ortalama kâr (TL) */
  effectiveNetProfitPerOrder: number;
  /** Efektif kâr marjı (%) */
  effectiveProfitMarginPercent: number;
  /** Başa baş (Break-even) iade oranı (%) - Bu oranın üzerinde satıcı genel toplamda zarar eder */
  breakEvenReturnRatePercent: number;
  /** Mevcut iade oranı ile başa baş oran arasındaki güvenlik marjı (+/- puan) */
  safetyMarginPoints: number;
  /** Kârlılık durumu: 'profitable' | 'break_even' | 'loss' */
  status: 'profitable' | 'break_even' | 'loss';
  /** İade maliyet kırılımı */
  breakdown: {
    totalShippingLoss: number;
    packagingLoss: number;
    inventoryDepreciationLoss: number;
    marketplaceReturnFee: number;
  };
  /** Aylık Projeksiyon (varsa sipariş adedine göre) */
  monthlyProjection?: {
    orderCount: number;
    estimatedReturnsCount: number;
    totalGrossRevenue: number;
    totalDirectReturnLoss: number;
    totalNetProfit: number;
  };
  /** Risk değerlendirmesi ve satıcı önerisi */
  evaluation: {
    severity: 'safe' | 'warning' | 'danger';
    title: string;
    description: string;
  };
}

export interface SectorReturnPreset {
  id: string;
  title: string;
  category: string;
  typicalReturnRate: number;
  damagedLossRate: number;
  description: string;
}

export const SECTOR_RETURN_PRESETS: SectorReturnPreset[] = [
  {
    id: 'fashion_apparel',
    title: 'Giyim & Tekstil',
    category: 'Moda',
    typicalReturnRate: 28,
    damagedLossRate: 6,
    description: 'Beden uymaması ve deneme nedeniyle sektörün en yüksek iade oranına sahip kategorisidir.',
  },
  {
    id: 'shoes_bags',
    title: 'Ayakkabı & Çanta',
    category: 'Moda',
    typicalReturnRate: 24,
    damagedLossRate: 8,
    description: 'Numara kalıbı ve kutu ezilmesi kaynaklı yüksek iade ve kutu yenileme maliyeti.',
  },
  {
    id: 'electronics',
    title: 'Elektronik & Aksesuar',
    category: 'Teknoloji',
    typicalReturnRate: 11,
    damagedLossRate: 12,
    description: 'Güvenlik bandı açılmış ürünlerin 2. el statüsüne düşmesi büyük amortisman kaybı yaratır.',
  },
  {
    id: 'cosmetics',
    title: 'Kozmetik & Kişisel Bakım',
    category: 'Güzellik',
    typicalReturnRate: 6,
    damagedLossRate: 20,
    description: 'Mevzuat gereği koruma bandı açılan ürünler hijyen nedeniyle yeniden satılamaz (%100 ziyan).',
  },
  {
    id: 'home_living',
    title: 'Ev & Yaşam / Dekorasyon',
    category: 'Ev',
    typicalReturnRate: 12,
    damagedLossRate: 10,
    description: 'Kargo taşınmasında kırılma/çatlama riskine bağlı kargo tazmini ve hasar kaybı.',
  },
  {
    id: 'books_stationery',
    title: 'Kitap & Kırtasiye',
    category: 'Kültür',
    typicalReturnRate: 5,
    damagedLossRate: 4,
    description: 'Düşük iade oranı ancak düşük kâr marjı nedeniyle kargo maliyetlerine karşı hassas.',
  },
];

/**
 * Sayıyı virgülden sonra 2 basamağa yuvarlar
 */
function roundTo2(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * E-Ticaret iade kaybı ve efektif kârlılığı hesaplar
 */
export function calculateReturnLoss(input: ReturnLossInput): ReturnLossResult {
  const salePrice = Math.max(0, input.salePrice);
  const costPrice = Math.max(0, input.costPrice);
  const commissionRate = Math.max(0, input.commissionRate);
  const returnRate = Math.min(100, Math.max(0, input.returnRate));
  const shippingOut = Math.max(0, input.shippingOutboundCost);
  const shippingRet = Math.max(0, input.shippingReturnCost);
  const packaging = Math.max(0, input.packagingCost || 0);
  const damagedRate = Math.min(100, Math.max(0, input.damagedLossRate || 0));
  const retFee = Math.max(0, input.marketplaceReturnFee || 0);

  // 1. Başarılı sipariş maliyetleri ve net kâr
  const commissionAmount = salePrice * (commissionRate / 100);
  // Başarılı siparişte kargo gidiş + paketleme + maliyet + komisyon düşülür
  const successfulNetProfit = roundTo2(
    salePrice - (costPrice + commissionAmount + shippingOut + packaging)
  );
  const successfulProfitMarginPercent =
    salePrice > 0 ? roundTo2((successfulNetProfit / salePrice) * 100) : 0;

  // 2. İade edilen siparişin zararı
  // Ürün satılamadığı için ciro 0'dır; komisyon iade edilir (veya çok küçük hizmet bedeli kalır)
  // Zarar: Gidiş kargo + Dönüş kargo + Ziyan olan ambalaj + Ürünün değer kaybı (costPrice * damagedRate%) + İade işlem bedeli
  const inventoryDepreciationLoss = roundTo2(costPrice * (damagedRate / 100));
  const totalShippingLoss = roundTo2(shippingOut + shippingRet);
  const singleReturnDirectLoss = roundTo2(
    totalShippingLoss + packaging + inventoryDepreciationLoss + retFee
  );

  // 3. İade oranı ağırlıklı efektif sipariş başına kâr
  // P_eff = (1 - r) * Profit_succ - r * Loss_ret
  const r = returnRate / 100;
  const effectiveNetProfitPerOrder = roundTo2(
    (1 - r) * successfulNetProfit - r * singleReturnDirectLoss
  );
  const effectiveProfitMarginPercent =
    salePrice > 0 ? roundTo2((effectiveNetProfitPerOrder / salePrice) * 100) : 0;

  // 4. Başa baş iade oranı (Break-even return rate)
  // (1 - r_be) * Profit_succ = r_be * Loss_ret => r_be = Profit_succ / (Profit_succ + Loss_ret)
  let breakEvenReturnRatePercent = 0;
  if (successfulNetProfit <= 0) {
    breakEvenReturnRatePercent = 0; // Zaten başarılı satışta bile zarar ediliyor
  } else {
    const denom = successfulNetProfit + singleReturnDirectLoss;
    breakEvenReturnRatePercent = denom > 0 ? roundTo2((successfulNetProfit / denom) * 100) : 100;
  }

  const safetyMarginPoints = roundTo2(breakEvenReturnRatePercent - returnRate);

  // 5. Durum belirleme
  let status: 'profitable' | 'break_even' | 'loss' = 'profitable';
  if (effectiveNetProfitPerOrder < -0.01) {
    status = 'loss';
  } else if (Math.abs(effectiveNetProfitPerOrder) <= 0.01) {
    status = 'break_even';
  }

  // 6. Aylık Projeksiyon
  let monthlyProjection: ReturnLossResult['monthlyProjection'] = undefined;
  if (input.monthlyOrderCount && input.monthlyOrderCount > 0) {
    const orderCount = Math.floor(input.monthlyOrderCount);
    const estimatedReturnsCount = Math.round(orderCount * r);
    const successfulCount = orderCount - estimatedReturnsCount;
    const totalGrossRevenue = roundTo2(successfulCount * salePrice);
    const totalDirectReturnLoss = roundTo2(estimatedReturnsCount * singleReturnDirectLoss);
    const totalNetProfit = roundTo2(orderCount * effectiveNetProfitPerOrder);

    monthlyProjection = {
      orderCount,
      estimatedReturnsCount,
      totalGrossRevenue,
      totalDirectReturnLoss,
      totalNetProfit,
    };
  }

  // 7. Değerlendirme & Tavsiye
  let evaluation: ReturnLossResult['evaluation'];
  if (status === 'loss') {
    evaluation = {
      severity: 'danger',
      title: 'Kritik İade Riski: Satış Başına Zarar Ediyorsunuz!',
      description: `Mevcut %${returnRate} iade oranınız, başa baş sınırı olan %${breakEvenReturnRatePercent} seviyesini aşmıştır. İade kargo ve amortisman masrafları başarılı satış kârını yutmakta, sipariş başına ortalama ${Math.abs(effectiveNetProfitPerOrder)} TL zarar edilmektedir.`,
    };
  } else if (safetyMarginPoints < 5) {
    evaluation = {
      severity: 'warning',
      title: 'Hassas Eşik: İade Oranınız Başa Baş Sınırına Çok Yakın',
      description: `Başa baş iade sınırınız %${breakEvenReturnRatePercent}. İade oranında oluşacak %${safetyMarginPoints} puanlık ufak bir artış operasyonunuzu zarara sürükleyebilir. Paketleme kalitesini ve beden/ürün açıklamalarını iyileştirmeniz önerilir.`,
    };
  } else {
    evaluation = {
      severity: 'safe',
      title: 'Güvenli Kârlılık Alanı',
      description: `Mevcut %${returnRate} iade oranı sürdürülebilirdir. Başa baş iade limitiniz %${breakEvenReturnRatePercent} olup ${safetyMarginPoints} puanlık güvenli kâr marjınız bulunmaktadır.`,
    };
  }

  return {
    successfulNetProfit,
    successfulProfitMarginPercent,
    singleReturnDirectLoss,
    effectiveNetProfitPerOrder,
    effectiveProfitMarginPercent,
    breakEvenReturnRatePercent,
    safetyMarginPoints,
    status,
    breakdown: {
      totalShippingLoss,
      packagingLoss: packaging,
      inventoryDepreciationLoss,
      marketplaceReturnFee: retFee,
    },
    monthlyProjection,
    evaluation,
  };
}
