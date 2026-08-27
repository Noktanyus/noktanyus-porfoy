/**
 * Multi-Currency Servisi + Vergi (Tax) Hesaplama.
 *
 * - Desteklenen para birimleri: TRY, USD, EUR, GBP.
 * - Kur bilgisi ExchangeRate tablosunda 24 saatlik TTL ile cache'lenir.
 * - Manual / api / fallback kaynakli kur destegi.
 * - Para formatlama tr-TR / en-US locale ayrimiyla.
 * - Ulke bazli vergi orani (TaxRate tablosu); default %20 TR.
 *
 * Phase "Multi-currency + Tax + A/B Testing" kapsaminda eklendi.
 */

import { prisma } from '@/lib/prisma';

export const SUPPORTED_CURRENCIES = ['TRY', 'USD', 'EUR', 'GBP'] as const;
export type Currency = (typeof SUPPORTED_CURRENCIES)[number];

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  TRY: '₺',
  USD: '$',
  EUR: '€',
  GBP: '£',
};

// Locale bazli formatlama (1.234,56 TRY vs 1,234.56 USD)
const LOCALE_MAP: Record<Currency, string> = {
  TRY: 'tr-TR',
  USD: 'en-US',
  EUR: 'de-DE',
  GBP: 'en-GB',
};

// Fallback kurlar (DB bos / cache yoksa). 2026 yaklasik degerler.
const FALLBACK_RATES: Record<string, number> = {
  'USD-TRY': 32.5,
  'EUR-TRY': 35.2,
  'GBP-TRY': 41.0,
  'TRY-USD': 0.031,
  'TRY-EUR': 0.028,
  'TRY-GBP': 0.024,
  'USD-EUR': 0.92,
  'EUR-USD': 1.087,
  'USD-GBP': 0.79,
  'GBP-USD': 1.266,
  'EUR-GBP': 0.86,
  'GBP-EUR': 1.163,
};

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 saat

function isSupportedCurrency(value: string): value is Currency {
  return SUPPORTED_CURRENCIES.includes(value as Currency);
}

export const currencyService = {
  /**
   * Iki para birimi arasinda donusum oranini getirir.
   * - Ayni kur ise 1 doner.
   * - Oncelik: cache (24h TTL) -> fallback hardcoded rates.
   * - Bulunamazsa 1 doner (safe default).
   */
  async getExchangeRate(from: Currency, to: Currency): Promise<number> {
    if (from === to) return 1;
    if (!isSupportedCurrency(from) || !isSupportedCurrency(to)) {
      return 1;
    }

    try {
      const cached = await prisma.exchangeRate.findUnique({
        where: { fromCurr_toCurr: { fromCurr: from, toCurr: to } },
      });

      if (
        cached &&
        Date.now() - cached.validAt.getTime() < CACHE_TTL_MS
      ) {
        return cached.rate;
      }
    } catch {
      // DB erisim yoksa fallback'e dus
    }

    const key = `${from}-${to}`;
    return FALLBACK_RATES[key] ?? 1;
  },

  /**
   * Cent bazinda tutari hedef parabirimine cevirir.
   * Round-to-nearest ile yuvarlar (kucuk tutarlar icin kayipsiz).
   */
  async convert(amountCents: number, from: Currency, to: Currency): Promise<number> {
    if (from === to) return amountCents;
    const rate = await this.getExchangeRate(from, to);
    return Math.round(amountCents * rate);
  },

  /**
   * Cent -> human-readable format. Or: 10000 TRY -> "₺100,00"
   */
  format(amountCents: number, currency: Currency = 'TRY'): string {
    const safeCurrency: Currency = isSupportedCurrency(currency) ? currency : 'TRY';
    const amount = amountCents / 100;
    const symbol = CURRENCY_SYMBOLS[safeCurrency];
    const locale = LOCALE_MAP[safeCurrency];

    const formatter = new Intl.NumberFormat(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    return `${symbol}${formatter.format(amount)}`;
  },

  /**
   * Manuel kur eklemek / guncellemek icin kullanilir.
   */
  async setRate(from: Currency, to: Currency, rate: number, source: 'manual' | 'api' = 'manual'): Promise<void> {
    await prisma.exchangeRate.upsert({
      where: { fromCurr_toCurr: { fromCurr: from, toCurr: to } },
      create: { fromCurr: from, toCurr: to, rate, source },
      update: { rate, source, validAt: new Date() },
    });
  },

  isSupportedCurrency,
};

export const taxService = {
  /**
   * Ulkeye gore vergi oranini getirir. TR default %20 VAT.
   */
  async getTaxRate(country: string = 'TR'): Promise<number> {
    try {
      const tax = await prisma.taxRate.findUnique({ where: { country } });
      if (tax && tax.active) return tax.rate;
    } catch {
      // DB erisim yoksa default'a dus
    }

    // Default ulke bazli oranlar (TaxRate tablosu bos olabilir)
    const defaults: Record<string, number> = {
      TR: 0.20, // Turkey KDV
      US: 0.08, // US avg sales tax (state-dependent)
      DE: 0.19, // Germany MwSt
      GB: 0.20, // UK VAT
      FR: 0.20, // France TVA
      NL: 0.21, // Netherlands BTW
      ES: 0.21, // Spain IVA
      IT: 0.22, // Italy IVA
      CA: 0.13, // Canada GST+HST avg
    };

    return defaults[country] ?? 0.20;
  },

  /**
   * Cent bazinda tutara vergi ekler.
   * Or: 10000 cent + %20 = 12000 cent total.
   */
  async calculateTax(
    amountCents: number,
    country: string = 'TR'
  ): Promise<{ tax: number; total: number; rate: number; taxCountry: string }> {
    const rate = await this.getTaxRate(country);
    const tax = Math.round(amountCents * rate);
    return {
      tax,
      total: amountCents + tax,
      rate,
      taxCountry: country,
    };
  },

  /**
   * Vergi oranini kaydet / guncelle.
   */
  async upsert(country: string, countryName: string, rate: number, type: 'vat' | 'gst' | 'sales_tax' = 'vat'): Promise<void> {
    await prisma.taxRate.upsert({
      where: { country },
      create: { country, countryName, rate, type, active: true },
      update: { countryName, rate, type, active: true },
    });
  },
};

/**
 * Default vergi oranlarini seed eder (idempotent).
 * Genellikle db:seed veya ilk kurulum script'i olarak cagrilir.
 */
export async function seedDefaultTaxRates(): Promise<void> {
  const defaults = [
    { country: 'TR', countryName: 'Turkey', rate: 0.20, type: 'vat' as const },
    { country: 'US', countryName: 'United States', rate: 0.08, type: 'sales_tax' as const },
    { country: 'DE', countryName: 'Germany', rate: 0.19, type: 'vat' as const },
    { country: 'GB', countryName: 'United Kingdom', rate: 0.20, type: 'vat' as const },
    { country: 'FR', countryName: 'France', rate: 0.20, type: 'vat' as const },
  ];

  for (const entry of defaults) {
    await taxService.upsert(entry.country, entry.countryName, entry.rate, entry.type);
  }
}
