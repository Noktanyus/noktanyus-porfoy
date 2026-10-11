/**
 * @file customsTax.ts
 * @description Yurt Dışı Alışveriş (Temu, AliExpress, Amazon vb.) Bireysel Gümrük Vergisi
 *              ve 30 Avro Muafiyet Sınırı Hesaplama Motoru.
 *
 * Yasal Dayanaklar:
 * 1. 4458 sayılı Gümrük Kanununun Bazı Maddelerinin Uygulanması Hakkında Kararda Değişiklik
 *    Yapılmasına Dair Cumhurbaşkanı Kararı (Resmi Gazete: 06 Ağustos 2024 - Sayı: 32624):
 *    - Posta veya hızlı kargo taşımacılığı yoluyla gerçek kişilere gelen ticari miktar ve mahiyet
 *      arz etmeyen eşyada kıymet tavanı 150 Avro'dan 30 Avro'ya düşürülmüştür.
 * 2. Gümrük Vergisi Oranları (m.62):
 *    - Avrupa Birliği (AB) ülkelerinden doğrudan gelen eşyadan: %30
 *    - Diğer ülkelerden (Çin, ABD, İngiltere vb.) gelen eşyadan: %60
 * 3. 4760 sayılı Özel Tüketim Vergisi Kanununa ekli (IV) sayılı liste:
 *    - Kulaklık, hoparlör, televizyon, eğlence/oyun eşyası vb. olması durumunda ilave %20 ÖTV tahsil edilir.
 * 4. Sabit Harçlar:
 *    - Gümrük Sunum Ücreti ve Damga Vergisi gümrük idaresi ve PTT/kargo tarafından eklenir.
 */

export const CUSTOMS_LIMITS = {
  PERSONAL_IMPORT_LIMIT_EUR: 30,
  EU_DUTY_RATE_PERCENT: 30,
  NON_EU_DUTY_RATE_PERCENT: 60,
  SCT_IV_RATE_PERCENT: 20, // Özel Tüketim Vergisi (IV)
  DEFAULT_PRESENTATION_FEE_TRY: 40.0, // Gümrük sunum ücreti
  DEFAULT_STAMP_TAX_TRY: 8.5, // Damga pulu vergisi
  DEFAULT_EUR_TRY_RATE: 38.5,
  DEFAULT_USD_TO_EUR: 0.92,
};

export interface CustomsTaxInput {
  productPrice: number;
  currency: 'EUR' | 'USD' | 'TRY';
  origin: 'EU' | 'NON_EU'; // AB veya Diğer (Çin, ABD vb.)
  includeShippingInCustomsValue?: boolean; // Kargo faturaya dahil mi
  shippingFee?: number;
  isSpecialConsumptionTaxApplied?: boolean; // ÖTV IV sayılı liste (+%20)
  eurExchangeRate?: number;
  usdToEurRate?: number;
}

export interface CustomsTaxResult {
  productPrice: number;
  currency: 'EUR' | 'USD' | 'TRY';
  productPriceEur: number;
  shippingFeeEur: number;
  customsValueEur: number;
  isExceeding30EurLimit: boolean;
  status: 'SIMPLIFIED_CUSTOMS' | 'COMMERCIAL_IMPORT_REQUIRED';
  statusMessageTr: string;
  dutyRatePercent: number;
  dutyAmountEur: number;
  dutyAmountTry: number;
  sctRatePercent: number;
  sctAmountEur: number;
  sctAmountTry: number;
  presentationFeeTry: number;
  stampTaxTry: number;
  totalTaxPayableTry: number;
  totalLandedCostTry: number;
  effectiveTaxRatioPercent: number;
  legalBasis: {
    decreeDate: string;
    decreeNo: string;
    summary: string;
  };
}

export function calculateCustomsTax(input: CustomsTaxInput): CustomsTaxResult {
  const price = Math.max(0, Number(input.productPrice) || 0);
  const currency = input.currency || 'EUR';
  const origin = input.origin || 'NON_EU';
  const includeShipping = Boolean(input.includeShippingInCustomsValue);
  const shipping = Math.max(0, Number(input.shippingFee) || 0);
  const isSct = Boolean(input.isSpecialConsumptionTaxApplied);

  const eurRate = input.eurExchangeRate && input.eurExchangeRate > 0 ? input.eurExchangeRate : CUSTOMS_LIMITS.DEFAULT_EUR_TRY_RATE;
  const usdToEur = input.usdToEurRate && input.usdToEurRate > 0 ? input.usdToEurRate : CUSTOMS_LIMITS.DEFAULT_USD_TO_EUR;

  // Convert to EUR for threshold testing
  let priceEur = 0;
  let shippingEur = 0;

  if (currency === 'EUR') {
    priceEur = price;
    shippingEur = shipping;
  } else if (currency === 'USD') {
    priceEur = price * usdToEur;
    shippingEur = shipping * usdToEur;
  } else if (currency === 'TRY') {
    priceEur = eurRate > 0 ? price / eurRate : 0;
    shippingEur = eurRate > 0 ? shipping / eurRate : 0;
  }

  priceEur = Math.round(priceEur * 100) / 100;
  shippingEur = Math.round(shippingEur * 100) / 100;

  // Gümrük Kıymeti: Ürün bedeli (ve faturada ayrılamıyorsa kargo)
  const customsValueEur = includeShipping ? priceEur + shippingEur : priceEur;
  const isExceeding30EurLimit = customsValueEur > CUSTOMS_LIMITS.PERSONAL_IMPORT_LIMIT_EUR;

  // Duty Rate based on Country of Origin
  const dutyRatePercent = origin === 'EU' ? CUSTOMS_LIMITS.EU_DUTY_RATE_PERCENT : CUSTOMS_LIMITS.NON_EU_DUTY_RATE_PERCENT;
  const dutyAmountEur = Math.round((customsValueEur * (dutyRatePercent / 100)) * 100) / 100;
  const dutyAmountTry = Math.round((dutyAmountEur * eurRate) * 100) / 100;

  // SCT (ÖTV IV) Rate
  const sctRatePercent = isSct ? CUSTOMS_LIMITS.SCT_IV_RATE_PERCENT : 0;
  const sctAmountEur = isSct ? Math.round((customsValueEur * (sctRatePercent / 100)) * 100) / 100 : 0;
  const sctAmountTry = Math.round((sctAmountEur * eurRate) * 100) / 100;

  const presentationFeeTry = CUSTOMS_LIMITS.DEFAULT_PRESENTATION_FEE_TRY;
  const stampTaxTry = CUSTOMS_LIMITS.DEFAULT_STAMP_TAX_TRY;

  // Total Tax in TRY
  const totalTaxPayableTry = Math.round((dutyAmountTry + sctAmountTry + presentationFeeTry + stampTaxTry) * 100) / 100;

  // Product price in TRY
  let priceTry = 0;
  if (currency === 'TRY') priceTry = price;
  else if (currency === 'EUR') priceTry = price * eurRate;
  else if (currency === 'USD') priceTry = (price * usdToEur) * eurRate;

  const shippingTry = includeShipping ? 0 : (currency === 'TRY' ? shipping : shippingEur * eurRate);
  const totalLandedCostTry = Math.round((priceTry + shippingTry + totalTaxPayableTry) * 100) / 100;

  const effectiveTaxRatioPercent = priceTry > 0 ? Math.round((totalTaxPayableTry / priceTry) * 1000) / 10 : 0;

  let status: 'SIMPLIFIED_CUSTOMS' | 'COMMERCIAL_IMPORT_REQUIRED' = 'SIMPLIFIED_CUSTOMS';
  let statusMessageTr = '';

  if (isExceeding30EurLimit) {
    status = 'COMMERCIAL_IMPORT_REQUIRED';
    statusMessageTr = `Paket bedeli (${customsValueEur} €), Ağustos 2024 kararnamesi ile belirlenen 30 Avro bireysel muafiyet sınırını aşmaktadır. Ürün basitleştirilmiş hızlı kargo gümrüklemesinden çıkar, ticari ithalat rejimine tabi tutulur ve gümrük müşaviri aracılığıyla detaylı beyanname açılması gerekir.`;
  } else {
    status = 'SIMPLIFIED_CUSTOMS';
    statusMessageTr = `Paket bedeli (${customsValueEur} €), 30 Avro yasal sınırının altındadır. Basitleştirilmiş usulde ${dutyRatePercent === 30 ? 'AB (%30)' : 'Çin/Diğer (%60)'} maktu vergi ve harçlar ödenerek kapınıza teslim edilir.`;
  }

  return {
    productPrice: price,
    currency,
    productPriceEur: priceEur,
    shippingFeeEur: shippingEur,
    customsValueEur,
    isExceeding30EurLimit,
    status,
    statusMessageTr,
    dutyRatePercent,
    dutyAmountEur,
    dutyAmountTry,
    sctRatePercent,
    sctAmountEur,
    sctAmountTry,
    presentationFeeTry,
    stampTaxTry,
    totalTaxPayableTry,
    totalLandedCostTry,
    effectiveTaxRatioPercent,
    legalBasis: {
      decreeDate: '2024-08-06',
      decreeNo: '32624 Sayılı Resmi Gazete (Karar Sayısı: 8787)',
      summary: 'Yurt dışı hızlı kargo siparişlerinde muafiyet tavanı 30 Avro’ya indirilmiş; vergi oranları AB için %30’a, diğer ülkeler için %60’a yükseltilmiştir.',
    },
  };
}
