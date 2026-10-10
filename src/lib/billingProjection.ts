/**
 * Kullanım → TRY maliyet tahmini (kredi birim fiyatı + abonelik).
 */

import { API_CREDIT_PACKS } from '@/lib/apiCredits';

/** Öne çıkan paket birim fiyatı (kuruş / istek). */
export function creditUnitPriceCents(): number {
  const featured =
    API_CREDIT_PACKS.find((p) => p.featured) ?? API_CREDIT_PACKS[0];
  return featured.priceCents / featured.credits;
}

export interface BillingProjectionInput {
  monthToDate: number;
  projectedMonthEnd: number;
  quotaLimit: number;
  billingSource: 'subscription' | 'credits' | null;
  /** Aktif plan aylık fiyatı (kuruş); yoksa 0 */
  planPriceCents: number;
  creditBalance: number;
}

export interface BillingProjection {
  unitPriceCents: number;
  /** Kota içi isteklerin kredi karşılığı (bilgi) */
  mtdCreditEquivalentCents: number;
  projectedOverageRequests: number;
  projectedOverageCents: number;
  /** Abonelik + tahmini aşım (veya salt kredi) */
  projectedBillCents: number;
  note: string;
}

export function computeBillingProjection(
  input: BillingProjectionInput
): BillingProjection {
  const unit = creditUnitPriceCents();
  const quota = Math.max(0, input.quotaLimit);
  const mtd = Math.max(0, input.monthToDate);
  const projected = Math.max(0, input.projectedMonthEnd);

  const mtdCreditEquivalentCents = Math.round(mtd * unit);

  if (input.billingSource === 'subscription' && quota > 0) {
    const overage = Math.max(0, projected - quota);
    const overageCents = Math.round(overage * unit);
    return {
      unitPriceCents: unit,
      mtdCreditEquivalentCents,
      projectedOverageRequests: overage,
      projectedOverageCents: overageCents,
      projectedBillCents: input.planPriceCents + overageCents,
      note:
        overage > 0
          ? 'Ay sonu tahmini: plan ücreti + kota aşımı (kredi birim fiyatıyla).'
          : 'Ay sonu tahmini: yalnızca plan ücreti (aşım beklenmiyor).',
    };
  }

  // Kredi veya kota yok
  const billableProjected = projected;
  const projectedBillCents = Math.round(billableProjected * unit);
  const coveredByBalance = Math.min(input.creditBalance, billableProjected);
  const shortfall = Math.max(0, billableProjected - input.creditBalance);

  return {
    unitPriceCents: unit,
    mtdCreditEquivalentCents,
    projectedOverageRequests: shortfall,
    projectedOverageCents: Math.round(shortfall * unit),
    projectedBillCents,
    note:
      shortfall > 0
        ? `Mevcut hızla ~${shortfall.toLocaleString('tr-TR')} kredi daha gerekir (~${coveredByBalance.toLocaleString('tr-TR')} bakiyede).`
        : 'Mevcut kredi bakiyesi ay sonu hızına yetiyor (tahmini).',
  };
}
