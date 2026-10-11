/**
 * @file microExportEtgb.ts
 * @description Türkiye E-İhracat / Mikro İhracat (ETGB - Elektronik Ticaret Gümrük Beyannamesi)
 *              uygunluk denetimi, KDV İadesi ve GVK m.89/16 %50 kazanç istisnası hesaplama motoru.
 *
 * Yasal Dayanaklar:
 * 1. 4458 sayılı Gümrük Kanunu & Posta ve Hızlı Kargo Taşımacılığı Gümrük Tebliği (Seri No: 4):
 *    - Hızlı kargo firmaları (DHL, UPS, FedEx, PTS, PTT vb.) aracılığıyla yapılan,
 *      brüt ağırlığı 300 kg'ı ve mal bedeli 15.000 Avro'yu (EUR) geçmeyen ihracatlar
 *      "Mikro İhracat" sayılır ve ETGB ile gümrük müşavirliği ücreti ödemeden beyan edilir.
 * 2. 3065 sayılı KDV Kanunu m.11/1-a:
 *    - İhracat teslimleri KDV'den istisnadır (%0 KDV). Faturada KDV İstisna Kodu 301 (Mal İhracatı) kullanılır.
 *    - İhraç edilen malın tedarik veya imalatında yüklenilen KDV, GİB'den nakden veya mahsuben KDV İADESİ olarak talep edilir.
 * 3. 193 sayılı Gelir Vergisi Kanunu m.89/1-16:
 *    - Tam mükellef gerçek kişilerin ETGB kapsamında gerçekleştirdikleri mikro ihracattan
 *      elde ettikleri kazancın %50'si belirli şartlarla gelir vergisinden muaftır (kazanç indirimi).
 */

export const ETGB_LIMITS = {
  MAX_WEIGHT_KG: 300,
  MAX_VALUE_EUR: 15000,
  VAT_EXEMPTION_CODE: '301',
  VAT_EXEMPTION_NAME: '3065 s. KDV K. m.11/1-a - Mal İhracatı',
  DEFAULT_EUR_TRY_RATE: 38.5,
  DEFAULT_USD_TRY_RATE: 36.5,
};

export interface AuthorizedCarrier {
  code: string;
  name: string;
  supportsEtgb: boolean;
  trackingFormatHint: string;
}

export const AUTHORIZED_ETGB_CARRIERS: AuthorizedCarrier[] = [
  { code: 'DHL', name: 'DHL Express Turkey', supportsEtgb: true, trackingFormatHint: '10 haneli rakam (örn. 1234567890)' },
  { code: 'FEDEX', name: 'FedEx Express / TNT', supportsEtgb: true, trackingFormatHint: '12 haneli rakam' },
  { code: 'UPS', name: 'UPS Hızlı Kargo', supportsEtgb: true, trackingFormatHint: '1Z ile başlayan 18 haneli takip no' },
  { code: 'PTS', name: 'PTS Worldwide Express', supportsEtgb: true, trackingFormatHint: 'PTS ile başlayan takip no' },
  { code: 'PTT', name: 'PTT Turpex / Posta', supportsEtgb: true, trackingFormatHint: 'CP/EE ile başlayan 13 haneli UPU barkodu' },
  { code: 'NAVLUGO', name: 'Navlungo / Lojistik Pazaryeri', supportsEtgb: true, trackingFormatHint: 'NL ile başlayan sevkiyat kodu' },
  { code: 'SHIPENTEGRA', name: 'ShipEntegra Express', supportsEtgb: true, trackingFormatHint: 'SE ile başlayan takip no' },
];

export interface MicroExportInput {
  weightKg: number;
  invoiceAmount: number;
  currency: 'EUR' | 'USD' | 'TRY' | 'GBP';
  eurExchangeRate?: number;
  usdToEurRate?: number;
  gbpToEurRate?: number;
  costOfGoodsSold?: number; // Ürün tedarik/maliyet tutarı (KDV hariç)
  costVatRate?: 10 | 20 | 1 | 0; // İmalat/tedarik KDV oranı
  estimatedProfitMarginPercent?: number; // Tahmini net kâr marjı (%)
  qualifiesForGvk89Exemption?: boolean; // GVK 89/16 şahıs şirketi ihracat kazanç indirimi
}

export interface MicroExportEvaluation {
  isEligible: boolean;
  status: 'MICRO_EXPORT_ETGB' | 'STANDARD_CUSTOMS_REQUIRED';
  statusMessageTr: string;
  weightKg: number;
  weightLimitKg: number;
  isWeightValid: boolean;
  invoiceAmount: number;
  currency: string;
  amountInEur: number;
  eurLimit: number;
  isAmountValid: boolean;
  vatExemptionCode: string;
  vatExemptionName: string;
  potentialVatRefund: {
    eligible: boolean;
    costOfGoodsSold: number;
    costVatRate: number;
    estimatedRefundAmount: number;
    currency: string;
    explanationTr: string;
  };
  incomeTaxIncentiveGvk89: {
    applied: boolean;
    estimatedProfit: number;
    exemptProfitAmount: number; // %50 istisna
    taxableProfitAmount: number;
    explanationTr: string;
  };
  customsChecklist: {
    item: string;
    description: string;
    mandatory: boolean;
  }[];
  ublExportSnippet: string;
}

export function evaluateMicroExport(input: MicroExportInput): MicroExportEvaluation {
  const weight = Math.max(0, Number(input.weightKg) || 0);
  const amount = Math.max(0, Number(input.invoiceAmount) || 0);
  const currency = input.currency || 'EUR';

  const eurRate = input.eurExchangeRate && input.eurExchangeRate > 0 ? input.eurExchangeRate : ETGB_LIMITS.DEFAULT_EUR_TRY_RATE;
  const usdToEur = input.usdToEurRate && input.usdToEurRate > 0 ? input.usdToEurRate : 0.92;
  const gbpToEur = input.gbpToEurRate && input.gbpToEurRate > 0 ? input.gbpToEurRate : 1.18;

  // Convert invoice amount to EUR for threshold verification
  let amountInEur = 0;
  if (currency === 'EUR') {
    amountInEur = amount;
  } else if (currency === 'USD') {
    amountInEur = amount * usdToEur;
  } else if (currency === 'GBP') {
    amountInEur = amount * gbpToEur;
  } else if (currency === 'TRY') {
    amountInEur = eurRate > 0 ? amount / eurRate : 0;
  }
  amountInEur = Math.round(amountInEur * 100) / 100;

  const isWeightValid = weight <= ETGB_LIMITS.MAX_WEIGHT_KG;
  const isAmountValid = amountInEur <= ETGB_LIMITS.MAX_VALUE_EUR;
  const isEligible = isWeightValid && isAmountValid;

  let statusMessageTr = '';
  if (isEligible) {
    statusMessageTr = `Gönderiniz ${weight} kg ve ${amountInEur.toLocaleString('tr-TR')} € değeri ile ETGB (Mikro İhracat) kapsamındadır. Gümrük müşavirliği ve harç ödemeden hızlı kargo operatörü üzerinden ihraç edebilirsiniz.`;
  } else if (!isWeightValid && !isAmountValid) {
    statusMessageTr = `Gönderi hem brüt ağırlık (300 kg) hem de tutar (15.000 €) limitini aştığı için standart gümrük beyannamesi (Detaylı Gümrük Beyannamesi & Gümrük Müşaviri) düzenlenmesi zorunludur.`;
  } else if (!isWeightValid) {
    statusMessageTr = `Brüt ağırlık ${weight} kg olup mikro ihracat tavanı olan 300 kg sınırını aşmaktadır. Standart gümrük beyannamesi açılmalıdır.`;
  } else {
    statusMessageTr = `Fatura bedeli ${amountInEur.toLocaleString('tr-TR')} € olup mikro ihracat tavanı olan 15.000 € sınırını aşmaktadır. Standart gümrük beyannamesi açılmalıdır.`;
  }

  // Potential VAT Refund (KDV İadesi) calculation
  const cogs = Math.max(0, Number(input.costOfGoodsSold) || 0);
  const costVatRate = input.costVatRate !== undefined ? input.costVatRate : 20;
  const estimatedRefundAmount = Math.round(cogs * (costVatRate / 100) * 100) / 100;

  // GVK m.89/16 50% export profit exemption
  const marginPercent = input.estimatedProfitMarginPercent !== undefined ? input.estimatedProfitMarginPercent : 25;
  const estimatedProfit = Math.round(amount * (marginPercent / 100) * 100) / 100;
  const isGvkApplied = Boolean(input.qualifiesForGvk89Exemption);
  const exemptProfitAmount = isGvkApplied ? Math.round((estimatedProfit * 0.5) * 100) / 100 : 0;
  const taxableProfitAmount = isGvkApplied ? Math.round((estimatedProfit - exemptProfitAmount) * 100) / 100 : estimatedProfit;

  const checklist = [
    {
      item: 'e-İhracat / e-Arşiv Fatura (KDV %0)',
      description: 'Fatura KDV oranı %0 ve İstisna Kodu 301 (3065 s. KDV m.11/1-a) olmalıdır.',
      mandatory: true,
    },
    {
      item: 'GTİP Kodu (En az 8-12 hane)',
      description: 'Gümrük Tarife İstatistik Pozisyonu (GTİP) ürün satırlarında zorunludur.',
      mandatory: true,
    },
    {
      item: 'İngilizce / Çok Dilli Açıklama',
      description: 'Ürün cinsi, menşei (Made in Türkiye) ve adedi yabancı dilde faturada yer almalıdır.',
      mandatory: true,
    },
    {
      item: 'Hızlı Kargo ETGB Beyan Formu',
      description: 'Taşıyıcı firmanın ETGB bilgi formu doldurulmalı ve onaylı fatura iletilmelidir.',
      mandatory: true,
    },
    {
      item: 'İntaç (Yurtdışı Çıkış) Takibi',
      description: 'Kargo firmasından temin edilecek ETGB dökümü (Gümrük tescil ve kapanış tarihi) KDV iadesi için saklanmalıdır.',
      mandatory: true,
    },
  ];

  const ublSnippet = `<!-- GİB UBL-TR 2.1 Mikro İhracat Fatura Örneği -->
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2">
  <cbc:ProfileID>IHRACAT</cbc:ProfileID>
  <cbc:InvoiceTypeCode>ISTISNA</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>${currency}</cbc:DocumentCurrencyCode>
  <!-- KDV İstisnası: 301 (Mal İhracatı) -->
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="${currency}">0.00</cbc:TaxAmount>
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="${currency}">${amount.toFixed(2)}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="${currency}">0.00</cbc:TaxAmount>
      <cbc:Percent>0</cbc:Percent>
      <cac:TaxCategory>
        <cac:TaxScheme>
          <cbc:Name>KDV</cbc:Name>
          <cbc:TaxTypeCode>0015</cbc:TaxTypeCode>
        </cac:TaxScheme>
        <cbc:TaxExemptionReasonCode>301</cbc:TaxExemptionReasonCode>
        <cbc:TaxExemptionReason>3065 sayılı KDV Kanunu 11/1-a Mal İhracatı (ETGB)</cbc:TaxExemptionReason>
      </cac:TaxCategory>
    </cac:TaxSubtotal>
  </cac:TaxTotal>
</Invoice>`;

  return {
    isEligible,
    status: isEligible ? 'MICRO_EXPORT_ETGB' : 'STANDARD_CUSTOMS_REQUIRED',
    statusMessageTr,
    weightKg: weight,
    weightLimitKg: ETGB_LIMITS.MAX_WEIGHT_KG,
    isWeightValid,
    invoiceAmount: amount,
    currency,
    amountInEur,
    eurLimit: ETGB_LIMITS.MAX_VALUE_EUR,
    isAmountValid,
    vatExemptionCode: ETGB_LIMITS.VAT_EXEMPTION_CODE,
    vatExemptionName: ETGB_LIMITS.VAT_EXEMPTION_NAME,
    potentialVatRefund: {
      eligible: cogs > 0 && isEligible,
      costOfGoodsSold: cogs,
      costVatRate,
      estimatedRefundAmount,
      currency,
      explanationTr:
        cogs > 0
          ? `Tedarik ettiğiniz malın KDV'si (%${costVatRate}) karşılığı yaklaşık ${estimatedRefundAmount.toLocaleString('tr-TR')} ${currency} tutarında yüklenilen KDV iadesi (nakden veya SGK/vergi borçlarına mahsup) talep edebilirsiniz.`
          : 'Tedarik/üretim maliyetini girdiğinizde KDV İadesi potansiyeli hesaplanır.',
    },
    incomeTaxIncentiveGvk89: {
      applied: isGvkApplied,
      estimatedProfit,
      exemptProfitAmount,
      taxableProfitAmount,
      explanationTr: isGvkApplied
        ? `GVK mük. 89/1-16 kapsamında mikro ihracat kazancınızın %50'si (${exemptProfitAmount.toLocaleString('tr-TR')} ${currency}) gelir vergisi matrahınızdan indirilir.`
        : 'Gerçek kişi şahıs şirketi mükellefleri GVK 89/1-16 uyarınca %50 kazanç indirimi teşvikinden yararlanabilir.',
    },
    customsChecklist: checklist,
    ublExportSnippet: ublSnippet,
  };
}
