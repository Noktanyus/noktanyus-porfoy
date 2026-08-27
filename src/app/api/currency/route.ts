/**
 * GET /api/currency
 * - Query: ?from=TRY&to=USD&amount=10000 (cent bazinda)
 * - Cent -> donusum -> format doner.
 * - Desteklenen currency'ler: TRY, USD, EUR, GBP.
 */

import { NextRequest } from 'next/server';
import { currencyService, SUPPORTED_CURRENCIES } from '@/modules/commerce/currencyService';
import { ok, withErrorHandling } from '@/lib/apiResponse';
import { AppError } from '@/lib/errors';

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const url = new URL(req.url);
    const from = (url.searchParams.get('from') ?? 'TRY').toUpperCase();
    const to = (url.searchParams.get('to') ?? 'USD').toUpperCase();
    const amountParam = url.searchParams.get('amount') ?? '0';
    const amount = parseInt(amountParam, 10);

    if (Number.isNaN(amount) || amount < 0) {
      throw new AppError('amount gecersiz (pozitif tam sayi olmali)', 400, 'INVALID_AMOUNT');
    }

    if (!SUPPORTED_CURRENCIES.includes(from as (typeof SUPPORTED_CURRENCIES)[number])) {
      throw new AppError(`Desteklenmeyen kaynak para birimi: ${from}`, 400, 'INVALID_CURRENCY');
    }

    if (!SUPPORTED_CURRENCIES.includes(to as (typeof SUPPORTED_CURRENCIES)[number])) {
      throw new AppError(`Desteklenmeyen hedef para birimi: ${to}`, 400, 'INVALID_CURRENCY');
    }

    const converted = await currencyService.convert(
      amount,
      from as (typeof SUPPORTED_CURRENCIES)[number],
      to as (typeof SUPPORTED_CURRENCIES)[number]
    );

    return ok({
      from,
      to,
      original: amount,
      converted,
      formatted: currencyService.format(converted, to as (typeof SUPPORTED_CURRENCIES)[number]),
    });
  });
}
