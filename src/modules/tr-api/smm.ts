/**
 * Serbest Meslek Makbuzu (SMM) Hesaplama Motoru
 *
 * 193 Sayılı Gelir Vergisi Kanunu ve 3065 Sayılı KDV Kanunu uyarınca:
 * - Brütten Nete ve Netten Brüte çift yönlü kuruş hassasiyetli hesaplama
 * - Stopaj (%20, %17 vb.), KDV (%20, %10 vb.) ve KDV Tevkifatı (2/10, 5/10, 7/10, 9/10)
 * - Müşterinin toplam maliyeti, muhtasarda ödenecek stopaj ve KDV-2 beyanı dökümü
 */

export type SmmWithholdingFraction = 'none' | '2/10' | '3/10' | '5/10' | '7/10' | '9/10' | '10/10';

export interface SmmInput {
  /** Tutar (TL cinsinden) */
  amount: number;
  /** 'gross' = Girilen tutar Brüt, 'net' = Girilen tutar Ele Geçen Net (varsayılan: 'gross') */
  mode?: 'gross' | 'net';
  /** Stopaj oranı (yüzde cinsinden, varsayılan: 20) */
  stopajRate?: number;
  /** KDV oranı (yüzde cinsinden, varsayılan: 20) */
  vatRate?: number;
  /** KDV Tevkifat oranı (varsayılan: 'none') */
  withholding?: SmmWithholdingFraction;
}

export interface SmmResult {
  mode: 'gross' | 'net';
  inputAmount: number;
  grossAmount: number;
  stopajRate: number;
  stopajAmount: number;
  netFee: number;
  vatRate: number;
  vatAmount: number;
  withholdingFraction: SmmWithholdingFraction;
  withheldVatAmount: number;
  collectedVatAmount: number;
  netReceived: number;
  clientTotalCost: number;
  totalTaxToState: number;
  kdv2Amount: number;
  summary: {
    clientCostBreakdown: string;
    receivedBreakdown: string;
  };
}

const WITHHOLDING_RATIOS: Record<SmmWithholdingFraction, number> = {
  none: 0,
  '2/10': 0.2,
  '3/10': 0.3,
  '5/10': 0.5,
  '7/10': 0.7,
  '9/10': 0.9,
  '10/10': 1.0,
};

/**
 * Serbest Meslek Makbuzu hesaplar
 */
export function calculateSmm(input: SmmInput): SmmResult {
  const inputAmount = Math.max(0, input.amount);
  const mode = input.mode ?? 'gross';
  const stopajRate = input.stopajRate !== undefined ? Math.max(0, input.stopajRate) : 20;
  const vatRate = input.vatRate !== undefined ? Math.max(0, input.vatRate) : 20;
  const withholding = input.withholding || 'none';
  const withholdingRatio = WITHHOLDING_RATIOS[withholding] ?? 0;

  const s = stopajRate / 100;
  const v = vatRate / 100;
  const t = withholdingRatio;

  let gross = 0;

  if (mode === 'gross') {
    gross = inputAmount;
  } else {
    // Netten Brüte: Net = Gross * (1 - s) + Gross * v * (1 - t) = Gross * [(1 - s) + v * (1 - t)]
    const factor = (1 - s) + v * (1 - t);
    gross = factor > 0 ? inputAmount / factor : inputAmount;
  }

  // Kuruş yuvarlama ile hassas hesaplama
  const grossAmount = Math.round(gross * 100) / 100;
  const stopajAmount = Math.round(grossAmount * s * 100) / 100;
  const netFee = Math.round((grossAmount - stopajAmount) * 100) / 100;

  const vatAmount = Math.round(grossAmount * v * 100) / 100;
  const withheldVatAmount = Math.round(vatAmount * t * 100) / 100;
  const collectedVatAmount = Math.round((vatAmount - withheldVatAmount) * 100) / 100;

  const netReceived = Math.round((netFee + collectedVatAmount) * 100) / 100;
  const clientTotalCost = Math.round((grossAmount + vatAmount) * 100) / 100;
  const totalTaxToState = Math.round((stopajAmount + withheldVatAmount) * 100) / 100;

  return {
    mode,
    inputAmount,
    grossAmount,
    stopajRate,
    stopajAmount,
    netFee,
    vatRate,
    vatAmount,
    withholdingFraction: withholding,
    withheldVatAmount,
    collectedVatAmount,
    netReceived,
    clientTotalCost,
    totalTaxToState,
    kdv2Amount: withheldVatAmount,
    summary: {
      clientCostBreakdown: `Brüt (₺${grossAmount.toFixed(2)}) + KDV (₺${vatAmount.toFixed(2)}) = Toplam ₺${clientTotalCost.toFixed(2)}`,
      receivedBreakdown: `Net Ücret (₺${netFee.toFixed(2)}) + Tahsil Edilen KDV (₺${collectedVatAmount.toFixed(2)}) = Ele Geçen ₺${netReceived.toFixed(2)}`,
    },
  };
}
