/**
 * Ağ / coğrafi / misc format doğrulayıcıları
 */

export function validateMac(raw: string): {
  valid: boolean;
  normalized: string;
  kind?: 'eui48' | 'eui64';
  reason?: string;
} {
  const hex = raw.replace(/[^0-9a-fA-F]/g, '').toLowerCase();
  if (hex.length === 12) return { valid: true, normalized: hex.match(/.{2}/g)!.join(':'), kind: 'eui48' };
  if (hex.length === 16) return { valid: true, normalized: hex.match(/.{2}/g)!.join(':'), kind: 'eui64' };
  return { valid: false, normalized: hex, reason: 'MAC 12 veya 16 hex olmalıdır' };
}

export function validateAsn(raw: string): { valid: boolean; normalized: string; reason?: string } {
  const normalized = raw.replace(/^AS/i, '').trim();
  const n = Number(normalized);
  if (!/^\d+$/.test(normalized) || n < 0 || n > 4294967295) {
    return { valid: false, normalized, reason: 'ASN 0–4294967295' };
  }
  return { valid: true, normalized };
}

export function validatePort(raw: string | number): {
  valid: boolean;
  port: number;
  reason?: string;
} {
  const port = typeof raw === 'number' ? raw : Number(String(raw).trim());
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    return { valid: false, port: Number.isFinite(port) ? port : -1, reason: 'Port 0–65535' };
  }
  return { valid: true, port };
}

const ISO_COUNTRIES = new Set(
  'AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW'
    .split(' ')
);

export function validateIsoCountry(raw: string): {
  valid: boolean;
  code: string;
  reason?: string;
} {
  const code = raw.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(code) || !ISO_COUNTRIES.has(code)) {
    return { valid: false, code, reason: 'ISO 3166-1 alpha-2 geçersiz' };
  }
  return { valid: true, code };
}

export function validateIsoLanguage(raw: string): { valid: boolean; code: string; reason?: string } {
  const code = raw.trim().toLowerCase();
  if (!/^[a-z]{2}(-[a-z]{2,8})?$/i.test(code)) {
    return { valid: false, code, reason: 'BCP 47 / ISO dil kodu beklenir' };
  }
  return { valid: true, code };
}

export function validateIata(raw: string): { valid: boolean; code: string; reason?: string } {
  const code = raw.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(code)) return { valid: false, code, reason: 'IATA 3 harf' };
  return { valid: true, code };
}

export function validateIcao(raw: string): { valid: boolean; code: string; reason?: string } {
  const code = raw.trim().toUpperCase();
  if (!/^[A-Z]{4}$/.test(code)) return { valid: false, code, reason: 'ICAO 4 harf' };
  return { valid: true, code };
}

export function validateTimezone(raw: string): { valid: boolean; zone: string; reason?: string } {
  const zone = raw.trim();
  try {
    Intl.DateTimeFormat(undefined, { timeZone: zone });
    return { valid: true, zone };
  } catch {
    return { valid: false, zone, reason: 'IANA timezone geçersiz' };
  }
}

export function validateSemver(raw: string): { valid: boolean; normalized: string; reason?: string } {
  const normalized = raw.trim().replace(/^v/, '');
  if (!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[\da-z-]+(?:\.[\da-z-]+)*)?(?:\+[\da-z-]+(?:\.[\da-z-]+)*)?$/i.test(normalized)) {
    return { valid: false, normalized, reason: 'Semver formatı geçersiz' };
  }
  return { valid: true, normalized };
}

export function validateSlug(raw: string): { valid: boolean; normalized: string; reason?: string } {
  const normalized = raw.trim().toLowerCase();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalized)) {
    return { valid: false, normalized, reason: 'Slug yalnızca a-z0-9 ve tire' };
  }
  return { valid: true, normalized };
}

export function validateColorHex(raw: string): {
  valid: boolean;
  normalized: string;
  reason?: string;
} {
  const normalized = raw.trim();
  if (!/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(normalized)) {
    return { valid: false, normalized, reason: '#RGB / #RRGGBB / #RRGGBBAA' };
  }
  return { valid: true, normalized: normalized.toLowerCase() };
}

export function validateLocale(raw: string): { valid: boolean; normalized: string; reason?: string } {
  const normalized = raw.trim().replace('_', '-');
  if (!/^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/.test(normalized)) {
    return { valid: false, normalized, reason: 'Locale örn. tr-TR' };
  }
  return { valid: true, normalized };
}
