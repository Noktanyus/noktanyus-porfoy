/**
 * Envanter / ödeme matematiği (commerce-validators tarzı)
 */

/** Yeniden sipariş noktası */
export function reorderPoint(input: {
  dailyDemand: number;
  leadTimeDays: number;
  safetyStock?: number;
  currentStock: number;
}): {
  reorderPoint: number;
  shouldReorder: boolean;
  coverageDays: number;
} {
  const safety = input.safetyStock ?? 0;
  const rop = input.dailyDemand * input.leadTimeDays + safety;
  const coverage =
    input.dailyDemand > 0 ? input.currentStock / input.dailyDemand : Number.POSITIVE_INFINITY;
  return {
    reorderPoint: Math.ceil(rop),
    shouldReorder: input.currentStock <= rop,
    coverageDays: Math.round(coverage * 100) / 100,
  };
}

/** Stripe Connect benzeri üçlü bölüşüm (cent) */
export function stripeConnectSplit(input: {
  chargeCents: number;
  applicationFeeCents?: number;
  stripeFeeCents?: number;
}): {
  chargeCents: number;
  stripeFeeCents: number;
  applicationFeeCents: number;
  sellerCents: number;
} {
  const charge = Math.max(0, Math.round(input.chargeCents));
  // Varsayılan yaklaşık: %2.9 + 30¢
  const stripeFee =
    input.stripeFeeCents ?? Math.round(charge * 0.029) + 30;
  const appFee = input.applicationFeeCents ?? 0;
  const seller = Math.max(0, charge - stripeFee - appFee);
  return {
    chargeCents: charge,
    stripeFeeCents: stripeFee,
    applicationFeeCents: appFee,
    sellerCents: seller,
  };
}
