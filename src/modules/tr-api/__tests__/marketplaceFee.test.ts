import { describe, it, expect } from 'vitest';
import {
  calculateMarketplaceFee,
  estimatePlatformCargoCost,
  MARKETPLACE_CATEGORIES,
  PLATFORMS,
} from '../marketplaceFee';

describe('Marketplace Fee & Profit Engine', () => {
  it('platform ve kategoriler eksiksiz tanımlı olmalı', () => {
    expect(PLATFORMS.trendyol).toBeDefined();
    expect(PLATFORMS.hepsiburada).toBeDefined();
    expect(PLATFORMS.amazon_tr).toBeDefined();
    expect(PLATFORMS.n11).toBeDefined();
    expect(MARKETPLACE_CATEGORIES.length).toBeGreaterThan(5);
  });

  it('kargo desi barem hesaplama mantığı doğru çalışmalı', () => {
    expect(estimatePlatformCargoCost(1)).toBe(42.5);
    expect(estimatePlatformCargoCost(2)).toBe(49.0);
    expect(estimatePlatformCargoCost(5)).toBe(62.0);
    expect(estimatePlatformCargoCost(10)).toBe(85.0);
  });

  it('Trendyol satışında net kâr ve komisyon doğru hesaplanmalı', () => {
    const result = calculateMarketplaceFee({
      platform: 'trendyol',
      salePrice: 500,
      purchasePrice: 200,
      customCommissionRate: 20, // %20 = 100 TL + %20 KDV = 120 TL
      cargoCost: 50,
      packagingCost: 10,
      serviceFee: 8.49,
      applyWithholding: false,
    });

    expect(result.commissionAmount).toBe(100);
    expect(result.commissionVat).toBe(20);
    expect(result.totalCommissionWithVat).toBe(120);
    expect(result.serviceFee).toBe(8.49);
    expect(result.cargoCost).toBe(50);
    expect(result.packagingCost).toBe(10);
    // Kesintiler: 120 (komisyon+kdv) + 50 (kargo) + 8.49 (hizmet) + 10 (ambalaj) = 188.49
    // Toplam maliyet: 200 + 188.49 = 388.49
    // Net Kâr: 500 - 388.49 = 111.51
    expect(result.netProfit).toBe(111.51);
    expect(result.isProfitable).toBe(true);
    expect(result.profitMarginPercent).toBeCloseTo(22.3, 1);
  });

  it('Zarar eden senaryo isProfitable: false dönmeli', () => {
    const result = calculateMarketplaceFee({
      platform: 'trendyol',
      salePrice: 100,
      purchasePrice: 90,
      customCommissionRate: 20, // 24 TL
      cargoCost: 50,
      serviceFee: 8.49,
    });

    expect(result.netProfit).toBeLessThan(0);
    expect(result.isProfitable).toBe(false);
  });

  it('Kategori seçildiğinde otomatik komisyon oranı çekilmeli', () => {
    const result = calculateMarketplaceFee({
      platform: 'trendyol',
      salePrice: 300,
      purchasePrice: 100,
      categoryId: 'giyim_moda',
      cargoDesi: 2,
    });

    expect(result.commissionRate).toBe(21);
    expect(result.cargoCost).toBe(49.0);
  });
});
