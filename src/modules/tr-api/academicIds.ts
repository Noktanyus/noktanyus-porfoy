/**
 * Akademik kimlikler: ORCID, ISNI, DOI format
 */

import { iso7064Mod97 } from './checksumAlgo';

export function validateOrcid(raw: string): { valid: boolean; normalized: string; reason?: string } {
  const normalized = raw.replace(/[\s-]/g, '').toUpperCase().replace(/^HTTPS?:\/\/ORCID\.ORG\//, '');
  if (!/^\d{15}[\dX]$/.test(normalized)) {
    return { valid: false, normalized, reason: 'ORCID 16 karakter (XXXX-XXXX-XXXX-XXXX)' };
  }
  // ISO 7064 MOD 11-2
  const base = normalized.slice(0, 15);
  let total = 0;
  for (const ch of base) {
    total = (total + Number(ch)) * 2;
  }
  const remainder = total % 11;
  const result = (12 - remainder) % 11;
  const check = result === 10 ? 'X' : String(result);
  if (check !== normalized[15]) {
    return { valid: false, normalized, reason: 'ORCID kontrol karakteri geçersiz' };
  }
  return { valid: true, normalized };
}

export function validateIsni(raw: string): { valid: boolean; normalized: string; reason?: string } {
  const normalized = raw.replace(/[\s-]/g, '').toUpperCase();
  if (!/^\d{15}[\dX]$/.test(normalized)) {
    return { valid: false, normalized, reason: 'ISNI 16 karakter olmalıdır' };
  }
  // same check as ORCID (ISO 7064)
  return validateOrcid(normalized);
}

export function validateDoi(raw: string): { valid: boolean; normalized: string; reason?: string } {
  const normalized = raw.trim();
  // doi:10.xxxx/yyy or 10.xxxx/yyy
  const cleaned = normalized.replace(/^doi:/i, '');
  if (!/^10\.\d{4,9}\/\S+$/.test(cleaned)) {
    return { valid: false, normalized: cleaned, reason: 'DOI 10.prefix/suffix formatında olmalıdır' };
  }
  return { valid: true, normalized: cleaned };
}

void iso7064Mod97; // reserved for extensions
