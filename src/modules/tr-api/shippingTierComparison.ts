/**
 * @file E-Ticaret Kargo Barem Fiyatlandırma & Çoklu Taşıyıcı Karşılaştırma Motoru
 * @description Türkiye'de faaliyet gösteren popüler kargo taşıyıcıları (Yurtiçi, Aras, MNG,
 *              Sürat, PTT, HepsiJet, Trendyol Express, Kolay Gelsin) için hacimsel desi vs
 *              fiili ağırlık matrahı, barem aralığı, mesafe çarpanı, akaryakıt payı (AKP)
 *              ve KDV dahil tahmini kargo maliyeti karşılaştırma motoru.
 */

export interface CarrierTierRate {
  carrierId: string;
  carrierName: string;
  logoColor: string;
  isMarketplaceIntegrated: boolean; // Trendyol/HepsiJet gibi pazaryeri anlaşmalı mı
  baseTierRates: {
    '0-1': number; // Dosya / 1 Desi
    '2': number;   // 2 Desi
    '3-5': number; // 3-5 Desi
    '6-10': number;// 6-10 Desi
    '11-15': number;
    '16-20': number;
    '21-30': number;
    perExtraDesiAbove30: number; // 30 desi üstü her desi başına ek
  };
  fuelSurchargePercent: number; // Akaryakıt katkı payı (AKP %)
}

/**
 * Türkiye Kargo Taşıyıcıları Gösterge Fiyat ve Barem Listesi (2024 Güncel Liste Simülasyonu)
 */
export const CARRIER_RATES: CarrierTierRate[] = [
  {
    carrierId: 'yurtici',
    carrierName: 'Yurtiçi Kargo',
    logoColor: 'text-yellow-400',
    isMarketplaceIntegrated: false,
    baseTierRates: {
      '0-1': 58.00,
      '2': 66.00,
      '3-5': 84.00,
      '6-10': 118.00,
      '11-15': 155.00,
      '16-20': 195.00,
      '21-30': 255.00,
      perExtraDesiAbove30: 8.50,
    },
    fuelSurchargePercent: 6.0,
  },
  {
    carrierId: 'aras',
    carrierName: 'Aras Kargo',
    logoColor: 'text-cyan-400',
    isMarketplaceIntegrated: false,
    baseTierRates: {
      '0-1': 55.00,
      '2': 64.00,
      '3-5': 82.00,
      '6-10': 115.00,
      '11-15': 150.00,
      '16-20': 190.00,
      '21-30': 248.00,
      perExtraDesiAbove30: 8.20,
    },
    fuelSurchargePercent: 5.5,
  },
  {
    carrierId: 'mng',
    carrierName: 'MNG Kargo (DHL eCommerce)',
    logoColor: 'text-blue-400',
    isMarketplaceIntegrated: false,
    baseTierRates: {
      '0-1': 56.00,
      '2': 65.00,
      '3-5': 83.00,
      '6-10': 116.00,
      '11-15': 152.00,
      '16-20': 192.00,
      '21-30': 250.00,
      perExtraDesiAbove30: 8.30,
    },
    fuelSurchargePercent: 5.0,
  },
  {
    carrierId: 'surat',
    carrierName: 'Sürat Kargo',
    logoColor: 'text-red-400',
    isMarketplaceIntegrated: false,
    baseTierRates: {
      '0-1': 50.00,
      '2': 58.00,
      '3-5': 74.00,
      '6-10': 104.00,
      '11-15': 138.00,
      '16-20': 175.00,
      '21-30': 230.00,
      perExtraDesiAbove30: 7.80,
    },
    fuelSurchargePercent: 4.5,
  },
  {
    carrierId: 'ptt',
    carrierName: 'PTT Kargo',
    logoColor: 'text-amber-500',
    isMarketplaceIntegrated: false,
    baseTierRates: {
      '0-1': 46.00,
      '2': 54.00,
      '3-5': 69.00,
      '6-10': 96.00,
      '11-15': 128.00,
      '16-20': 162.00,
      '21-30': 215.00,
      perExtraDesiAbove30: 7.00,
    },
    fuelSurchargePercent: 3.0,
  },
  {
    carrierId: 'trendyol_express',
    carrierName: 'Trendyol Express (TEX)',
    logoColor: 'text-orange-500',
    isMarketplaceIntegrated: true,
    baseTierRates: {
      '0-1': 42.00,
      '2': 49.00,
      '3-5': 64.00,
      '6-10': 88.00,
      '11-15': 118.00,
      '16-20': 150.00,
      '21-30': 200.00,
      perExtraDesiAbove30: 6.50,
    },
    fuelSurchargePercent: 0.0, // Genelde bareme dahildir
  },
  {
    carrierId: 'hepsijet',
    carrierName: 'HepsiJet',
    logoColor: 'text-orange-400',
    isMarketplaceIntegrated: true,
    baseTierRates: {
      '0-1': 44.00,
      '2': 51.00,
      '3-5': 66.00,
      '6-10': 91.00,
      '11-15': 122.00,
      '16-20': 155.00,
      '21-30': 208.00,
      perExtraDesiAbove30: 6.80,
    },
    fuelSurchargePercent: 0.0,
  },
  {
    carrierId: 'kolay_gelsin',
    carrierName: 'Kolay Gelsin',
    logoColor: 'text-rose-500',
    isMarketplaceIntegrated: false,
    baseTierRates: {
      '0-1': 52.00,
      '2': 60.00,
      '3-5': 78.00,
      '6-10': 108.00,
      '11-15': 142.00,
      '16-20': 180.00,
      '21-30': 238.00,
      perExtraDesiAbove30: 8.00,
    },
    fuelSurchargePercent: 4.0,
  },
];

export type ShippingDistance = 'intracity' | 'nearby' | 'intercity'; // Şehir İçi | Yakın Hat (0-600km) | Uzak Hat (600km+)

export interface ShippingTierInput {
  /** Koli Ebatları (cm) - Opsiyonel, girilirse desi otomatik hesaplanır */
  dimensions?: {
    widthCm: number;
    lengthCm: number;
    heightCm: number;
  };
  /** Hacimsel Desi (Doğrudan girilmek istenirse) */
  customVolumetricDesi?: number;
  /** Fiili Ağırlık (kg) */
  actualWeightKg?: number;
  /** Taşıma Mesafesi (Varsayılan: 'nearby' - Yakın/Orta Hat) */
  distance?: ShippingDistance;
  /** Kapıda Ödeme Hizmeti Eklensin mi? */
  cashOnDelivery?: boolean;
}

export interface CalculatedCarrierQuote {
  carrierId: string;
  carrierName: string;
  isMarketplaceIntegrated: boolean;
  baseFare: number;
  fuelSurchargeAmount: number;
  cashOnDeliveryFee: number;
  subtotalExclVat: number;
  vatAmount: number;
  totalEstimatedPriceInclVat: number;
  isCheapest: boolean;
}

export interface ShippingTierResult {
  chargeableDesi: number;
  volumetricDesi: number;
  actualWeightKg: number;
  matchedTier: string;
  distance: ShippingDistance;
  distanceMultiplier: number;
  quotes: CalculatedCarrierQuote[];
  cheapestCarrier: {
    carrierId: string;
    carrierName: string;
    totalPrice: number;
  };
  averageMarketPrice: number;
  maxSavingsAmount: number;
  recommendation: string;
}

function roundTo2(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * Boyutlardan hacimsel desiyi hesaplar (En * Boy * Yükseklik / 3000)
 */
export function calculateVolumetricDesi(width: number, length: number, height: number): number {
  const cubic = (Math.max(0, width) * Math.max(0, length) * Math.max(0, height)) / 3000;
  return roundTo2(cubic);
}

/**
 * Desi değerine göre barem kategorisini belirler
 */
export function getDesiTierCategory(desi: number): {
  tierKey: keyof CarrierTierRate['baseTierRates'];
  label: string;
} {
  if (desi <= 1) return { tierKey: '0-1', label: '0-1 Desi (Dosya / Küçük Paket)' };
  if (desi <= 2) return { tierKey: '2', label: '2 Desi' };
  if (desi <= 5) return { tierKey: '3-5', label: '3-5 Desi' };
  if (desi <= 10) return { tierKey: '6-10', label: '6-10 Desi' };
  if (desi <= 15) return { tierKey: '11-15', label: '11-15 Desi' };
  if (desi <= 20) return { tierKey: '16-20', label: '16-20 Desi' };
  if (desi <= 30) return { tierKey: '21-30', label: '21-30 Desi' };
  return { tierKey: 'perExtraDesiAbove30', label: `${Math.ceil(desi)} Desi (30+ Desi Ağır Kargo)` };
}

/**
 * Çoklu Taşıyıcı Kargo Fiyat Karşılaştırmasını Yapar
 */
export function compareShippingRates(input: ShippingTierInput): ShippingTierResult {
  let volumetricDesi = input.customVolumetricDesi ?? 0;
  if (input.dimensions) {
    volumetricDesi = calculateVolumetricDesi(
      input.dimensions.widthCm,
      input.dimensions.lengthCm,
      input.dimensions.heightCm
    );
  }

  const actualWeightKg = Math.max(0, input.actualWeightKg ?? 0);
  // Türkiye kargo standartlarında: Desi ve kg kıyaslanır, büyük olan fatura matrahıdır
  const chargeableDesi = roundTo2(Math.max(volumetricDesi, actualWeightKg, 1));

  const distance = input.distance ?? 'nearby';
  let distanceMultiplier = 1.0;
  if (distance === 'intracity') distanceMultiplier = 0.90; // Şehir içi %10 indirimli
  else if (distance === 'intercity') distanceMultiplier = 1.15; // Uzak mesafe %15 ek

  const { tierKey, label: matchedTier } = getDesiTierCategory(chargeableDesi);

  const quotes: CalculatedCarrierQuote[] = CARRIER_RATES.map((carrier) => {
    let baseFare = 0;
    if (chargeableDesi <= 30) {
      baseFare = carrier.baseTierRates[tierKey as keyof typeof carrier.baseTierRates] as number;
    } else {
      const base30 = carrier.baseTierRates['21-30'];
      const extraDesi = Math.ceil(chargeableDesi - 30);
      baseFare = base30 + extraDesi * carrier.baseTierRates.perExtraDesiAbove30;
    }

    // Mesafe katsayısı uygula
    baseFare = roundTo2(baseFare * distanceMultiplier);

    // Akaryakıt katkı payı (AKP)
    const fuelSurchargeAmount = roundTo2((baseFare * carrier.fuelSurchargePercent) / 100);

    // Kapıda ödeme bedeli (varsa ortalama 18 TL)
    const cashOnDeliveryFee = input.cashOnDelivery ? 18.00 : 0;

    const subtotalExclVat = roundTo2(baseFare + fuelSurchargeAmount + cashOnDeliveryFee);
    const vatAmount = roundTo2(subtotalExclVat * 0.20); // KDV %20
    const totalEstimatedPriceInclVat = roundTo2(subtotalExclVat + vatAmount);

    return {
      carrierId: carrier.carrierId,
      carrierName: carrier.carrierName,
      isMarketplaceIntegrated: carrier.isMarketplaceIntegrated,
      baseFare,
      fuelSurchargeAmount,
      cashOnDeliveryFee,
      subtotalExclVat,
      vatAmount,
      totalEstimatedPriceInclVat,
      isCheapest: false,
    };
  });

  // Fiyata göre artan sırala
  quotes.sort((a, b) => a.totalEstimatedPriceInclVat - b.totalEstimatedPriceInclVat);
  if (quotes.length > 0) {
    quotes[0].isCheapest = true;
  }

  const cheapestCarrier = {
    carrierId: quotes[0].carrierId,
    carrierName: quotes[0].carrierName,
    totalPrice: quotes[0].totalEstimatedPriceInclVat,
  };

  const sumPrices = quotes.reduce((acc, q) => acc + q.totalEstimatedPriceInclVat, 0);
  const averageMarketPrice = roundTo2(sumPrices / quotes.length);
  const mostExpensivePrice = quotes[quotes.length - 1].totalEstimatedPriceInclVat;
  const maxSavingsAmount = roundTo2(mostExpensivePrice - cheapestCarrier.totalPrice);

  const recommendation =
    `${chargeableDesi} matrah desisi için en uygun maliyetli taşıyıcı ` +
    `KDV dahil ${cheapestCarrier.totalPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL ile ` +
    `${cheapestCarrier.carrierName} olarak belirlenmiştir. En pahalı seçeneğe göre gönderi başına ` +
    `${maxSavingsAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL (%${roundTo2((maxSavingsAmount / mostExpensivePrice) * 100)} oranında) maliyet avantajı sağlanabilir.`;

  return {
    chargeableDesi,
    volumetricDesi,
    actualWeightKg,
    matchedTier,
    distance,
    distanceMultiplier,
    quotes,
    cheapestCarrier,
    averageMarketPrice,
    maxSavingsAmount,
    recommendation,
  };
}
