/**
 * Currency Normalization Helper — Phase 3 B.4
 *
 * Webhook payload'larindan gelen currency alani (free-form string) Prisma
 * TemplatePurchase.currency alani icin gecerli ISO 4217 koduna normalize edilir.
 * Desteklenmeyen/taninmamis degerler icin 'USD' default doner — webhook
 * retry'larinda ayni davranisi korumak icin deterministik.
 *
 * Desteklenen: 'TRY' | 'USD' | 'EUR' | 'GBP'
 */

export type SupportedCurrency = 'TRY' | 'USD' | 'EUR' | 'GBP';

const SUPPORTED: SupportedCurrency[] = ['TRY', 'USD', 'EUR', 'GBP'];

export function normalizeCurrency(input: string | null | undefined): SupportedCurrency {
  if (!input) return 'USD';
  const upper = input.trim().toUpperCase();
  if ((SUPPORTED as string[]).includes(upper)) return upper as SupportedCurrency;
  // Bilinen alias'lar
  if (upper === 'TL') return 'TRY';
  if (upper === '$') return 'USD';
  if (upper === '€') return 'EUR';
  if (upper === '£') return 'GBP';
  return 'USD';
}
