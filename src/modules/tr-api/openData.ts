/**
 * Açık veri / kütüphane sarmalayıcıları: tatil, telefon, EU VAT, TLD, TCMB, NHTSA, TR geo
 */

import Holidays from 'date-holidays';
import { parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js';
import { checkVAT, countries } from 'jsvat';

export function getHolidays(input: { country: string; year: number }) {
  const hd = new Holidays(input.country.toUpperCase());
  const list = hd.getHolidays(input.year);
  return {
    country: input.country.toUpperCase(),
    year: input.year,
    holidays: list.map((h) => ({
      date: h.date,
      name: h.name,
      type: h.type,
    })),
  };
}

export function isHolidayDate(input: { country: string; date: string }) {
  const hd = new Holidays(input.country.toUpperCase());
  const d = new Date(input.date + 'T12:00:00');
  const hit = hd.isHoliday(d);
  return {
    date: input.date,
    country: input.country.toUpperCase(),
    isHoliday: Boolean(hit),
    details: hit || null,
  };
}

export function validatePhoneGlobal(input: { phone: string; defaultCountry?: string }) {
  const parsed = parsePhoneNumberFromString(
    input.phone,
    (input.defaultCountry?.toUpperCase() || 'TR') as CountryCode
  );
  if (!parsed) {
    return { valid: false, reason: 'Numara parse edilemedi' };
  }
  return {
    valid: parsed.isValid(),
    e164: parsed.number,
    country: parsed.country,
    type: parsed.getType?.() ?? null,
    national: parsed.formatNational(),
    international: parsed.formatInternational(),
  };
}

export function validateEuVatJsvat(raw: string) {
  const normalized = raw.replace(/[\s.-]/g, '').toUpperCase();
  const result = checkVAT(normalized, countries);
  return {
    valid: Boolean(result.isValid),
    value: result.value,
    country: result.country?.name ?? result.country?.isoCode?.short ?? null,
    isValidFormat: result.isValidFormat,
    isSupportedCountry: result.isSupportedCountry,
  };
}

const TLDS = new Set(
  `com org net edu gov mil int info biz name pro museum aero coop
tr uk us de fr es it nl be ch at se no dk fi pl cz pt ie
io ai app dev cloud online store shop tech xyz site website
blog news media tv me co eu asia
gov.tr edu.tr org.tr net.tr bel.tr av.tr dr.tr k12.tr co.uk org.uk ac.uk`
    .split(/\s+/)
    .filter(Boolean)
);

export function validateDomainTld(raw: string): {
  valid: boolean;
  domain: string;
  tld?: string;
  reason?: string;
} {
  const domain = raw.trim().toLowerCase().replace(/\.$/, '');
  if (!/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/.test(domain)) {
    return { valid: false, domain, reason: 'Domain formatı geçersiz' };
  }
  const parts = domain.split('.');
  const tld2 = parts.slice(-2).join('.');
  const tld1 = parts[parts.length - 1]!;
  if (TLDS.has(tld2) || TLDS.has(tld1)) {
    return { valid: true, domain, tld: TLDS.has(tld2) ? tld2 : tld1 };
  }
  return {
    valid: true,
    domain,
    tld: tld1,
    reason: 'TLD listede yok; sözdizimi geçerli',
  };
}

let tcmbCache: { at: number; data: Awaited<ReturnType<typeof fetchTcmbRatesUncached>> } | null =
  null;

async function fetchTcmbRatesUncached() {
  const url = 'https://www.tcmb.gov.tr/kurlar/today.xml';
  const res = await fetch(url);
  if (!res.ok) throw new Error(`TCMB HTTP ${res.status}`);
  const xml = await res.text();
  const date = xml.match(/Date="([^"]+)"/)?.[1];
  const rates: Array<{
    code: string;
    forexBuying?: number;
    forexSelling?: number;
    name?: string;
  }> = [];
  const re =
    /Currency[^>]*CurrencyCode="([A-Z]+)"[\s\S]*?<Isim>([^<]*)<\/Isim>[\s\S]*?<ForexBuying>([^<]*)<\/ForexBuying>[\s\S]*?<ForexSelling>([^<]*)<\/ForexSelling>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) {
    rates.push({
      code: m[1]!,
      name: m[2],
      forexBuying: parseFloat(m[3]!.replace(',', '.')) || undefined,
      forexSelling: parseFloat(m[4]!.replace(',', '.')) || undefined,
    });
  }
  return { date, rates, source: url };
}

export async function fetchTcmbRates() {
  const now = Date.now();
  if (tcmbCache && now - tcmbCache.at < 60 * 60 * 1000) {
    return { ...tcmbCache.data, cached: true as const };
  }
  const data = await fetchTcmbRatesUncached();
  tcmbCache = { at: now, data };
  return { ...data, cached: false as const };
}

export async function decodeVinNhtsa(vin: string) {
  const v = vin.replace(/[\s-]/g, '').toUpperCase();
  const url = `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${encodeURIComponent(v)}?format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`NHTSA HTTP ${res.status}`);
  const json = (await res.json()) as { Results?: Array<Record<string, string>> };
  const row = json.Results?.[0] ?? {};
  return {
    vin: v,
    make: row.Make || undefined,
    model: row.Model || undefined,
    modelYear: row.ModelYear || undefined,
    plantCountry: row.PlantCountry || undefined,
    attribution: 'NHTSA vPIC (public)',
  };
}

export const TR_PROVINCES: ReadonlyArray<{ id: number; name: string; plate: string }> = [
  { id: 1, name: 'Adana', plate: '01' },
  { id: 2, name: 'Adıyaman', plate: '02' },
  { id: 3, name: 'Afyonkarahisar', plate: '03' },
  { id: 4, name: 'Ağrı', plate: '04' },
  { id: 5, name: 'Amasya', plate: '05' },
  { id: 6, name: 'Ankara', plate: '06' },
  { id: 7, name: 'Antalya', plate: '07' },
  { id: 8, name: 'Artvin', plate: '08' },
  { id: 9, name: 'Aydın', plate: '09' },
  { id: 10, name: 'Balıkesir', plate: '10' },
  { id: 11, name: 'Bilecik', plate: '11' },
  { id: 12, name: 'Bingöl', plate: '12' },
  { id: 13, name: 'Bitlis', plate: '13' },
  { id: 14, name: 'Bolu', plate: '14' },
  { id: 15, name: 'Burdur', plate: '15' },
  { id: 16, name: 'Bursa', plate: '16' },
  { id: 17, name: 'Çanakkale', plate: '17' },
  { id: 18, name: 'Çankırı', plate: '18' },
  { id: 19, name: 'Çorum', plate: '19' },
  { id: 20, name: 'Denizli', plate: '20' },
  { id: 21, name: 'Diyarbakır', plate: '21' },
  { id: 22, name: 'Edirne', plate: '22' },
  { id: 23, name: 'Elazığ', plate: '23' },
  { id: 24, name: 'Erzincan', plate: '24' },
  { id: 25, name: 'Erzurum', plate: '25' },
  { id: 26, name: 'Eskişehir', plate: '26' },
  { id: 27, name: 'Gaziantep', plate: '27' },
  { id: 28, name: 'Giresun', plate: '28' },
  { id: 29, name: 'Gümüşhane', plate: '29' },
  { id: 30, name: 'Hakkari', plate: '30' },
  { id: 31, name: 'Hatay', plate: '31' },
  { id: 32, name: 'Isparta', plate: '32' },
  { id: 33, name: 'Mersin', plate: '33' },
  { id: 34, name: 'İstanbul', plate: '34' },
  { id: 35, name: 'İzmir', plate: '35' },
  { id: 36, name: 'Kars', plate: '36' },
  { id: 37, name: 'Kastamonu', plate: '37' },
  { id: 38, name: 'Kayseri', plate: '38' },
  { id: 39, name: 'Kırklareli', plate: '39' },
  { id: 40, name: 'Kırşehir', plate: '40' },
  { id: 41, name: 'Kocaeli', plate: '41' },
  { id: 42, name: 'Konya', plate: '42' },
  { id: 43, name: 'Kütahya', plate: '43' },
  { id: 44, name: 'Malatya', plate: '44' },
  { id: 45, name: 'Manisa', plate: '45' },
  { id: 46, name: 'Kahramanmaraş', plate: '46' },
  { id: 47, name: 'Mardin', plate: '47' },
  { id: 48, name: 'Muğla', plate: '48' },
  { id: 49, name: 'Muş', plate: '49' },
  { id: 50, name: 'Nevşehir', plate: '50' },
  { id: 51, name: 'Niğde', plate: '51' },
  { id: 52, name: 'Ordu', plate: '52' },
  { id: 53, name: 'Rize', plate: '53' },
  { id: 54, name: 'Sakarya', plate: '54' },
  { id: 55, name: 'Samsun', plate: '55' },
  { id: 56, name: 'Siirt', plate: '56' },
  { id: 57, name: 'Sinop', plate: '57' },
  { id: 58, name: 'Sivas', plate: '58' },
  { id: 59, name: 'Tekirdağ', plate: '59' },
  { id: 60, name: 'Tokat', plate: '60' },
  { id: 61, name: 'Trabzon', plate: '61' },
  { id: 62, name: 'Tunceli', plate: '62' },
  { id: 63, name: 'Şanlıurfa', plate: '63' },
  { id: 64, name: 'Uşak', plate: '64' },
  { id: 65, name: 'Van', plate: '65' },
  { id: 66, name: 'Yozgat', plate: '66' },
  { id: 67, name: 'Zonguldak', plate: '67' },
  { id: 68, name: 'Aksaray', plate: '68' },
  { id: 69, name: 'Bayburt', plate: '69' },
  { id: 70, name: 'Karaman', plate: '70' },
  { id: 71, name: 'Kırıkkale', plate: '71' },
  { id: 72, name: 'Batman', plate: '72' },
  { id: 73, name: 'Şırnak', plate: '73' },
  { id: 74, name: 'Bartın', plate: '74' },
  { id: 75, name: 'Ardahan', plate: '75' },
  { id: 76, name: 'Iğdır', plate: '76' },
  { id: 77, name: 'Yalova', plate: '77' },
  { id: 78, name: 'Karabük', plate: '78' },
  { id: 79, name: 'Kilis', plate: '79' },
  { id: 80, name: 'Osmaniye', plate: '80' },
  { id: 81, name: 'Düzce', plate: '81' },
];

export function listTrProvinces() {
  return TR_PROVINCES;
}

export function lookupPostalProvince(postalCode: string) {
  const code = postalCode.replace(/\D/g, '');
  if (!/^\d{5}$/.test(code)) return { valid: false as const, reason: '5 haneli posta kodu' };
  const plate = code.slice(0, 2);
  const province = listTrProvinces().find((p) => p.plate === plate);
  return {
    valid: Boolean(province),
    postalCode: code,
    province: province ?? null,
    attribution: 'Yerel plaka-posta eşlemesi (TurkiyeAPI uyumlu seed)',
  };
}

export async function fetchTurkiyeDistricts(provinceId: number) {
  const url = `https://api.turkiyeapi.dev/v1/districts?provinceId=${provinceId}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(String(res.status));
    const json = await res.json();
    return {
      source: url,
      data: json,
      attribution: 'TurkiyeAPI — https://github.com/ubeydeozdmr/turkiye-api',
    };
  } catch {
    return {
      source: 'fallback',
      data: { provinceId, districts: [] },
      attribution: 'Uzaktan alınamadı',
    };
  }
}
