import { describe, it, expect } from 'vitest';
import { calculateReturnLoss, SECTOR_RETURN_PRESETS } from '../returnLoss';

describe('Turkish E-Commerce Return Loss Engine', () => {
  it('should have standard sector presets defined', () => {
    expect(SECTOR_RETURN_PRESETS.length).toBeGreaterThanOrEqual(5);
    const fashion = SECTOR_RETURN_PRESETS.find(p => p.id === 'fashion_apparel');
    expect(fashion).toBeDefined();
    expect(fashion?.typicalReturnRate).toBe(28);
  });

  it('should correctly calculate successful profit and single return loss', () => {
    // 500 TL Satış, 200 TL Maliyet, %20 Komisyon (100 TL), 40 TL Kargo Gidiş, 40 TL Dönüş, 10 TL Paketleme
    const result = calculateReturnLoss({
      salePrice: 500,
      costPrice: 200,
      commissionRate: 20,
      returnRate: 20,
      shippingOutboundCost: 40,
      shippingReturnCost: 40,
      packagingCost: 10,
      damagedLossRate: 5, // 200 * 0.05 = 10 TL yıpranma
      monthlyOrderCount: 100,
    });

    // Başarılı satış net kârı = 500 - (200 + 100 + 40 + 10) = 150 TL
    expect(result.successfulNetProfit).toBe(150);
    expect(result.successfulProfitMarginPercent).toBe(30);

    // Tek bir iadenin zararı = 40 (gidiş) + 40 (dönüş) + 10 (paket) + 10 (yıpranma) = 100 TL
    expect(result.singleReturnDirectLoss).toBe(100);

    // %20 iade oranıyla:
    // Efektif Kâr = (0.80 * 150) - (0.20 * 100) = 120 - 20 = 100 TL
    expect(result.effectiveNetProfitPerOrder).toBe(100);
    expect(result.effectiveProfitMarginPercent).toBe(20);

    // Başa baş iade oranı:
    // Profit_succ / (Profit_succ + Loss_ret) = 150 / (150 + 100) = 150 / 250 = %60
    expect(result.breakEvenReturnRatePercent).toBe(60);
    expect(result.safetyMarginPoints).toBe(40);
    expect(result.status).toBe('profitable');

    // Aylık projeksiyon
    expect(result.monthlyProjection).toBeDefined();
    expect(result.monthlyProjection?.orderCount).toBe(100);
    expect(result.monthlyProjection?.estimatedReturnsCount).toBe(20);
    expect(result.monthlyProjection?.totalDirectReturnLoss).toBe(2000); // 20 * 100
    expect(result.monthlyProjection?.totalNetProfit).toBe(10000); // 100 * 100
  });

  it('should detect when return rate causes overall loss (danger state)', () => {
    // Düşük kârlı ürün (200 TL satış, 140 TL maliyet, %15 komisyon = 30 TL, 35 TL gidiş kargo = -5 TL kâr zaten zararda veya kıl payı)
    const result = calculateReturnLoss({
      salePrice: 200,
      costPrice: 130,
      commissionRate: 15, // 30 TL
      returnRate: 40,     // Yüksek iade
      shippingOutboundCost: 30,
      shippingReturnCost: 30,
      packagingCost: 5,
      damagedLossRate: 10, // 130 * 0.1 = 13 TL
    });

    // Başarılı net kâr = 200 - (130 + 30 + 30 + 5) = 5 TL
    expect(result.successfulNetProfit).toBe(5);

    // İade zararı = 30 + 30 + 5 + 13 = 78 TL
    expect(result.singleReturnDirectLoss).toBe(78);

    // Efektif kâr = 0.60 * 5 - 0.40 * 78 = 3 - 31.2 = -28.2 TL
    expect(result.effectiveNetProfitPerOrder).toBeLessThan(0);
    expect(result.status).toBe('loss');
    expect(result.evaluation.severity).toBe('danger');
  });

  it('should handle zero prices and safe boundary conditions gracefully', () => {
    const result = calculateReturnLoss({
      salePrice: 0,
      costPrice: 0,
      commissionRate: 0,
      returnRate: 0,
      shippingOutboundCost: 0,
      shippingReturnCost: 0,
    });

    expect(result.successfulNetProfit).toBe(0);
    expect(result.singleReturnDirectLoss).toBe(0);
    expect(result.effectiveNetProfitPerOrder).toBe(0);
    expect(result.breakEvenReturnRatePercent).toBe(0);
  });
});
