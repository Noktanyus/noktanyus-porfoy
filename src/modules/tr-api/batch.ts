/**
 * Toplu doğrulama — her öğe ayrı sonuç.
 */

import { validateTckn, validateVkn, validateIban, validatePhone, validatePostalCode, validatePlate, validateCardLuhn, validateImei, validateEan13 } from './validators';
import {
  validateVin,
  validateContainer,
  validateIsbn10,
  validateIsbn13,
  validateIssn,
  validateIsin,
  validateCusip,
  validateSedol,
  validateAbaRouting,
  validateBic,
  validateGtin,
  validateUuid,
  validateUrl,
  validateIp,
  validateEthAddress,
  validateBtcAddress,
  detectCardBrand,
} from './checksums';
import { validateMersis, validateKep } from './tools';

export type BatchType =
  | 'tckn'
  | 'vkn'
  | 'iban'
  | 'phone'
  | 'postal'
  | 'plate'
  | 'card'
  | 'imei'
  | 'ean13'
  | 'vin'
  | 'container'
  | 'isbn10'
  | 'isbn13'
  | 'issn'
  | 'isin'
  | 'cusip'
  | 'sedol'
  | 'aba'
  | 'bic'
  | 'gtin'
  | 'uuid'
  | 'url'
  | 'ip'
  | 'eth'
  | 'btc'
  | 'mersis'
  | 'kep'
  | 'cardBrand';

const HANDLERS: Record<BatchType, (v: string) => unknown> = {
  tckn: validateTckn,
  vkn: validateVkn,
  iban: validateIban,
  phone: (v) => validatePhone(v),
  postal: validatePostalCode,
  plate: validatePlate,
  card: validateCardLuhn,
  imei: validateImei,
  ean13: validateEan13,
  vin: validateVin,
  container: validateContainer,
  isbn10: validateIsbn10,
  isbn13: validateIsbn13,
  issn: validateIssn,
  isin: validateIsin,
  cusip: validateCusip,
  sedol: validateSedol,
  aba: validateAbaRouting,
  bic: validateBic,
  gtin: validateGtin,
  uuid: validateUuid,
  url: validateUrl,
  ip: validateIp,
  eth: validateEthAddress,
  btc: validateBtcAddress,
  mersis: validateMersis,
  kep: validateKep,
  cardBrand: detectCardBrand,
};

export function runBatchValidate(input: {
  type: BatchType;
  values: string[];
}): { type: BatchType; count: number; results: unknown[] } {
  const fn = HANDLERS[input.type];
  if (!fn) throw new Error('Bilinmeyen type');
  if (input.values.length > 100) throw new Error('En fazla 100 değer');
  return {
    type: input.type,
    count: input.values.length,
    results: input.values.map((v) => fn(v)),
  };
}
