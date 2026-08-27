/**
 * Currency Service Tests
 *
 * - Multi-currency donusum
 * - Formatlama (locale ayrimi)
 * - Tax hesaplama
 * - Fallback rate'ler
 *
 * Prisma mock'lanarak DB bagimliligi izole edilir.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    exchangeRate: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    taxRate: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';
import {
  currencyService,
  taxService,
  SUPPORTED_CURRENCIES,
  CURRENCY_SYMBOLS,
} from '../currencyService';

describe('CurrencyService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('SUPPORTED_CURRENCIES', () => {
    it('TRY, USD, EUR, GBP desteklenir', () => {
      expect(SUPPORTED_CURRENCIES).toContain('TRY');
      expect(SUPPORTED_CURRENCIES).toContain('USD');
      expect(SUPPORTED_CURRENCIES).toContain('EUR');
      expect(SUPPORTED_CURRENCIES).toContain('GBP');
      expect(SUPPORTED_CURRENCIES).toHaveLength(4);
    });
  });

  describe('CURRENCY_SYMBOLS', () => {
    it('her currency bir sembole sahip', () => {
      expect(CURRENCY_SYMBOLS.TRY).toBe('₺');
      expect(CURRENCY_SYMBOLS.USD).toBe('$');
      expect(CURRENCY_SYMBOLS.EUR).toBe('€');
      expect(CURRENCY_SYMBOLS.GBP).toBe('£');
    });
  });

  describe('isSupportedCurrency', () => {
    it('desteklenen currency true doner', () => {
      expect(currencyService.isSupportedCurrency('TRY')).toBe(true);
      expect(currencyService.isSupportedCurrency('USD')).toBe(true);
    });

    it('desteklenmeyen currency false doner', () => {
      expect(currencyService.isSupportedCurrency('JPY')).toBe(false);
      expect(currencyService.isSupportedCurrency('xyz')).toBe(false);
    });
  });

  describe('getExchangeRate', () => {
    it('ayni currency icin 1 doner', async () => {
      const rate = await currencyService.getExchangeRate('TRY', 'TRY');
      expect(rate).toBe(1);
    });

    it('desteklenmeyen currency icin 1 doner (safe fallback)', async () => {
      const rate = await currencyService.getExchangeRate('TRY', 'JPY' as never);
      expect(rate).toBe(1);
    });

    it('cache miss durumunda fallback orani doner', async () => {
      vi.mocked(prisma.exchangeRate.findUnique).mockResolvedValueOnce(null);
      const rate = await currencyService.getExchangeRate('USD', 'TRY');
      expect(rate).toBe(32.5);
    });

    it('cache hit durumunda cache degerini doner', async () => {
      vi.mocked(prisma.exchangeRate.findUnique).mockResolvedValueOnce({
        id: 'er1',
        fromCurr: 'USD',
        toCurr: 'TRY',
        rate: 35.0,
        source: 'api',
        validAt: new Date(),
        createdAt: new Date(),
      });
      const rate = await currencyService.getExchangeRate('USD', 'TRY');
      expect(rate).toBe(35.0);
    });

    it('24 saatten eski cache terk edilir, fallback doner', async () => {
      const expired = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25h once
      vi.mocked(prisma.exchangeRate.findUnique).mockResolvedValueOnce({
        id: 'er1',
        fromCurr: 'USD',
        toCurr: 'TRY',
        rate: 100.0, // intentionally yanlis
        source: 'api',
        validAt: expired,
        createdAt: new Date(),
      });
      const rate = await currencyService.getExchangeRate('USD', 'TRY');
      expect(rate).toBe(32.5); // fallback
    });

    it('DB hatasi fallback olarak yakalanir', async () => {
      vi.mocked(prisma.exchangeRate.findUnique).mockRejectedValueOnce(
        new Error('DB down')
      );
      const rate = await currencyService.getExchangeRate('USD', 'TRY');
      expect(rate).toBe(32.5);
    });
  });

  describe('convert', () => {
    it('ayni currency icin ayni tutar doner', async () => {
      const cents = await currencyService.convert(10000, 'TRY', 'TRY');
      expect(cents).toBe(10000);
    });

    it('USD -> TRY donusumu yapar (fallback rate ile)', async () => {
      vi.mocked(prisma.exchangeRate.findUnique).mockResolvedValueOnce(null);
      // 10000 cent = $100, 32.5 rate ile -> 325000 cent = ₺3250.00
      const cents = await currencyService.convert(10000, 'USD', 'TRY');
      expect(cents).toBe(325000);
    });
  });

  describe('format', () => {
    it('TRY formatinda ₺ sembolu ve tr-TR locale kullanir', () => {
      const out = currencyService.format(10000, 'TRY');
      expect(out).toContain('₺');
      expect(out).toMatch(/100,00/);
    });

    it('USD formatinda $ sembolu ve ondalik kullanir', () => {
      const out = currencyService.format(10000, 'USD');
      expect(out).toContain('$');
      expect(out).toContain('100.00');
    });

    it('EUR formatinda € sembolu kullanir', () => {
      const out = currencyService.format(10000, 'EUR');
      expect(out).toContain('€');
    });

    it('GBP formatinda £ sembolu kullanir', () => {
      const out = currencyService.format(10000, 'GBP');
      expect(out).toContain('£');
    });

    it('desteklenmeyen currency TRY olarak fallback yapar', () => {
      const out = currencyService.format(10000, 'XYZ' as never);
      expect(out).toContain('₺');
    });
  });

  describe('setRate', () => {
    it('exchange rate upsert eder', async () => {
      vi.mocked(prisma.exchangeRate.upsert).mockResolvedValueOnce({} as never);
      await currencyService.setRate('USD', 'EUR', 0.92, 'api');
      expect(prisma.exchangeRate.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { fromCurr_toCurr: { fromCurr: 'USD', toCurr: 'EUR' } },
          create: { fromCurr: 'USD', toCurr: 'EUR', rate: 0.92, source: 'api' },
          update: expect.objectContaining({ rate: 0.92, source: 'api' }),
        })
      );
    });
  });
});

describe('TaxService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getTaxRate', () => {
    it('TR default %20 doner (DB bos iken)', async () => {
      vi.mocked(prisma.taxRate.findUnique).mockResolvedValueOnce(null);
      const rate = await taxService.getTaxRate('TR');
      expect(rate).toBeCloseTo(0.20, 2);
    });

    it('US default %8 doner (TaxRate tablosu bos)', async () => {
      vi.mocked(prisma.taxRate.findUnique).mockResolvedValueOnce(null);
      const rate = await taxService.getTaxRate('US');
      expect(rate).toBeCloseTo(0.08, 2);
    });

    it('DE default %19 doner', async () => {
      vi.mocked(prisma.taxRate.findUnique).mockResolvedValueOnce(null);
      const rate = await taxService.getTaxRate('DE');
      expect(rate).toBeCloseTo(0.19, 2);
    });

    it('DB dolu ise aktif vergi oranini doner', async () => {
      vi.mocked(prisma.taxRate.findUnique).mockResolvedValueOnce({
        id: 't1',
        country: 'TR',
        countryName: 'Turkey',
        rate: 0.18, // ozel oran
        type: 'vat',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const rate = await taxService.getTaxRate('TR');
      expect(rate).toBe(0.18);
    });

    it('inaktif kayit varsa default orana dusmez, default\'a doner', async () => {
      vi.mocked(prisma.taxRate.findUnique).mockResolvedValueOnce({
        id: 't1',
        country: 'TR',
        countryName: 'Turkey',
        rate: 0.18,
        type: 'vat',
        active: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const rate = await taxService.getTaxRate('TR');
      expect(rate).toBeCloseTo(0.20, 2);
    });

    it('bilinmeyen ulke icin generic %20 doner', async () => {
      vi.mocked(prisma.taxRate.findUnique).mockResolvedValueOnce(null);
      const rate = await taxService.getTaxRate('XX');
      expect(rate).toBe(0.20);
    });

    it('DB hatasi durumunda default orana dusmez', async () => {
      vi.mocked(prisma.taxRate.findUnique).mockRejectedValueOnce(new Error('DB down'));
      const rate = await taxService.getTaxRate('TR');
      expect(rate).toBeCloseTo(0.20, 2);
    });
  });

  describe('calculateTax', () => {
    it('TR icin %20 KDV hesaplar', async () => {
      vi.mocked(prisma.taxRate.findUnique).mockResolvedValueOnce(null);
      const result = await taxService.calculateTax(10000, 'TR');
      expect(result.rate).toBeCloseTo(0.20, 2);
      expect(result.tax).toBe(2000); // %20
      expect(result.total).toBe(12000);
      expect(result.taxCountry).toBe('TR');
    });

    it('default country TR\'dir (parametre yoksa)', async () => {
      vi.mocked(prisma.taxRate.findUnique).mockResolvedValueOnce(null);
      const result = await taxService.calculateTax(10000);
      expect(result.taxCountry).toBe('TR');
      expect(result.rate).toBeCloseTo(0.20, 2);
    });

    it('US icin %8 sales tax hesaplar', async () => {
      vi.mocked(prisma.taxRate.findUnique).mockResolvedValueOnce(null);
      const result = await taxService.calculateTax(10000, 'US');
      expect(result.rate).toBeCloseTo(0.08, 2);
      expect(result.tax).toBe(800);
    });
  });

  describe('upsert', () => {
    it('tax rate upsert eder', async () => {
      vi.mocked(prisma.taxRate.upsert).mockResolvedValueOnce({} as never);
      await taxService.upsert('TR', 'Turkey', 0.18, 'vat');
      expect(prisma.taxRate.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { country: 'TR' },
          create: { country: 'TR', countryName: 'Turkey', rate: 0.18, type: 'vat', active: true },
          update: { countryName: 'Turkey', rate: 0.18, type: 'vat', active: true },
        })
      );
    });
  });
});
