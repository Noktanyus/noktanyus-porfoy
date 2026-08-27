/**
 * GET /api/tax/calculate
 * - Query: ?amount=10000&country=TR (cent bazinda tutar + ISO ulke kodu)
 * - Vergi oranini doner ve vergili toplami hesaplar.
 */

import { NextRequest } from 'next/server';
import { taxService } from '@/modules/commerce/currencyService';
import { ok, withErrorHandling } from '@/lib/apiResponse';
import { AppError } from '@/lib/errors';

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const url = new URL(req.url);
    const amountParam = url.searchParams.get('amount') ?? '0';
    const country = (url.searchParams.get('country') ?? 'TR').toUpperCase();
    const amount = parseInt(amountParam, 10);

    if (Number.isNaN(amount) || amount < 0) {
      throw new AppError('amount gecersiz (pozitif tam sayi olmali)', 400, 'INVALID_AMOUNT');
    }

    if (country.length !== 2) {
      throw new AppError('country ISO 3166-1 alpha-2 kodu olmali (orn: TR, US)', 400, 'INVALID_COUNTRY');
    }

    const result = await taxService.calculateTax(amount, country);

    return ok({
      ...result,
      formatted: {
        subtotal: (amount / 100).toFixed(2),
        tax: (result.tax / 100).toFixed(2),
        total: (result.total / 100).toFixed(2),
      },
    });
  });
}
