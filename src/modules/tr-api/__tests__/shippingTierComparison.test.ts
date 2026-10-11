import { describe, it, expect } from 'vitest';
import {
  calculateVolumetricDesi,
  getDesiTierCategory,
  compareShippingRates,
  CARRIER_RATES,
} from '../shippingTierComparison';

describe('E-Ticaret Kargo Barem Fiyatlandırma & Çoklu Taşıyıcı Karşılaştırma Motoru', () => {
  it('Taşıyıcı listesi en az 8 kargo firmasını içermelidir', () => {
    expect(CARRIER_RATES.length).toBeGreaterThanOrEqual(8);
    const yurtici = CARRIER_RATES.find((c) => c.carrierId === 'yurtici');
    expect(yurtici).toBeDefined();
    const tex = CARRIER_RATES.find((c) => c.carrierId === 'trendyol_express');
    expect(tex?.isMarketplaceIntegrated).toBe(true);
  });

  it('Boyutlardan (En x Boy x Yükseklik / 3000) desiyi doğru hesaplamalıdır', () => {
    // 30 x 20 x 10 / 3000 = 6000 / 3000 = 2 desi
    const desi = calculateVolumetricDesi(30, 20, 10);
    expect(desi).toBe(2);
  });

  it('Desi barem aralığını doğru sınıflandırmalıdır', () => {
    expect(getDesiTierCategory(0.8).tierKey).toBe('0-1');
    expect(getDesiTierCategory(2).tierKey).toBe('2');
    expect(getDesiTierCategory(4.5).tierKey).toBe('3-5');
    expect(getDesiTierCategory(8).tierKey).toBe('6-10');
    expect(getDesiTierCategory(35).tierKey).toBe('perExtraDesiAbove30');
  });

  it('Fiili ağırlık desiden büyükse ağırlığı fatura matrahı olarak almalıdır', () => {
    // Desi: 2, Ağırlık: 7 kg -> Matrah: 7 desi (6-10 baremi)
    const result = compareShippingRates({
      dimensions: { widthCm: 30, lengthCm: 20, heightCm: 10 }, // 2 desi
      actualWeightKg: 7,
    });

    expect(result.chargeableDesi).toBe(7);
    expect(result.matchedTier).toContain('6-10');
    expect(result.quotes.length).toBe(CARRIER_RATES.length);
    expect(result.cheapestCarrier.totalPrice).toBeLessThan(result.averageMarketPrice);
  });

  it('Farklı mesafeler (şehir içi vs şehirlerarası) çarpanı doğru uygulamalıdır', () => {
    const localRes = compareShippingRates({
      customVolumetricDesi: 3,
      distance: 'intracity',
    });
    const intercityRes = compareShippingRates({
      customVolumetricDesi: 3,
      distance: 'intercity',
    });

    expect(localRes.cheapestCarrier.totalPrice).toBeLessThan(intercityRes.cheapestCarrier.totalPrice);
    expect(localRes.distanceMultiplier).toBe(0.9);
    expect(intercityRes.distanceMultiplier).toBe(1.15);
  });
});
