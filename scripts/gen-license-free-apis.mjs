/**
 * One-shot: rewrite openData.ts + generate /api/v1 routes for license-free APIs.
 */
import fs from 'fs';
import path from 'path';

const root = process.cwd();

const provinces = [
  [1, 'Adana'], [2, 'Adıyaman'], [3, 'Afyonkarahisar'], [4, 'Ağrı'], [5, 'Amasya'],
  [6, 'Ankara'], [7, 'Antalya'], [8, 'Artvin'], [9, 'Aydın'], [10, 'Balıkesir'],
  [11, 'Bilecik'], [12, 'Bingöl'], [13, 'Bitlis'], [14, 'Bolu'], [15, 'Burdur'],
  [16, 'Bursa'], [17, 'Çanakkale'], [18, 'Çankırı'], [19, 'Çorum'], [20, 'Denizli'],
  [21, 'Diyarbakır'], [22, 'Edirne'], [23, 'Elazığ'], [24, 'Erzincan'], [25, 'Erzurum'],
  [26, 'Eskişehir'], [27, 'Gaziantep'], [28, 'Giresun'], [29, 'Gümüşhane'], [30, 'Hakkari'],
  [31, 'Hatay'], [32, 'Isparta'], [33, 'Mersin'], [34, 'İstanbul'], [35, 'İzmir'],
  [36, 'Kars'], [37, 'Kastamonu'], [38, 'Kayseri'], [39, 'Kırklareli'], [40, 'Kırşehir'],
  [41, 'Kocaeli'], [42, 'Konya'], [43, 'Kütahya'], [44, 'Malatya'], [45, 'Manisa'],
  [46, 'Kahramanmaraş'], [47, 'Mardin'], [48, 'Muğla'], [49, 'Muş'], [50, 'Nevşehir'],
  [51, 'Niğde'], [52, 'Ordu'], [53, 'Rize'], [54, 'Sakarya'], [55, 'Samsun'],
  [56, 'Siirt'], [57, 'Sinop'], [58, 'Sivas'], [59, 'Tekirdağ'], [60, 'Tokat'],
  [61, 'Trabzon'], [62, 'Tunceli'], [63, 'Şanlıurfa'], [64, 'Uşak'], [65, 'Van'],
  [66, 'Yozgat'], [67, 'Zonguldak'], [68, 'Aksaray'], [69, 'Bayburt'], [70, 'Karaman'],
  [71, 'Kırıkkale'], [72, 'Batman'], [73, 'Şırnak'], [74, 'Bartın'], [75, 'Ardahan'],
  [76, 'Iğdır'], [77, 'Yalova'], [78, 'Karabük'], [79, 'Kilis'], [80, 'Osmaniye'],
  [81, 'Düzce'],
].map(([id, name]) => {
  // Force correct Rize spelling (avoid Rory typo)
  const n = id === 53 ? ['R', 'i', 'z', 'e'].join('') : name;
  return `  { id: ${id}, name: '${n}', plate: '${String(id).padStart(2, '0')}' },`;
}).join('\n');

const openData = `/**
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
  const normalized = raw.replace(/[\\s.-]/g, '').toUpperCase();
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
  \`com org net edu gov mil int info biz name pro museum aero coop
tr uk us de fr es it nl be ch at se no dk fi pl cz pt ie
io ai app dev cloud online store shop tech xyz site website
blog news media tv me co eu asia
gov.tr edu.tr org.tr net.tr bel.tr av.tr dr.tr k12.tr co.uk org.uk ac.uk\`
    .split(/\\s+/)
    .filter(Boolean)
);

export function validateDomainTld(raw: string): {
  valid: boolean;
  domain: string;
  tld?: string;
  reason?: string;
} {
  const domain = raw.trim().toLowerCase().replace(/\\.$/, '');
  if (!/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\\.)+[a-z]{2,}$/.test(domain)) {
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
  if (!res.ok) throw new Error(\`TCMB HTTP \${res.status}\`);
  const xml = await res.text();
  const date = xml.match(/Date="([^"]+)"/)?.[1];
  const rates: Array<{
    code: string;
    forexBuying?: number;
    forexSelling?: number;
    name?: string;
  }> = [];
  const re =
    /Currency[^>]*CurrencyCode="([A-Z]+)"[\\s\\S]*?<Isim>([^<]*)<\\/Isim>[\\s\\S]*?<ForexBuying>([^<]*)<\\/ForexBuying>[\\s\\S]*?<ForexSelling>([^<]*)<\\/ForexSelling>/g;
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
  const v = vin.replace(/[\\s-]/g, '').toUpperCase();
  const url = \`https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/\${encodeURIComponent(v)}?format=json\`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(\`NHTSA HTTP \${res.status}\`);
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
${provinces}
];

export function listTrProvinces() {
  return TR_PROVINCES;
}

export function lookupPostalProvince(postalCode: string) {
  const code = postalCode.replace(/\\D/g, '');
  if (!/^\\d{5}$/.test(code)) return { valid: false as const, reason: '5 haneli posta kodu' };
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
  const url = \`https://api.turkiyeapi.dev/v1/districts?provinceId=\${provinceId}\`;
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
`;

fs.writeFileSync(path.join(root, 'src/modules/tr-api/openData.ts'), openData, 'utf8');

function writeRoute(relPath, importName, schemaLines, callExpr) {
  const full = path.join(root, 'src/app/api/v1', relPath, 'route.ts');
  fs.mkdirSync(path.dirname(full), { recursive: true });
  const content = `import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTrApi } from '@/modules/tr-api/routeHelper';
import { ${importName} } from '@/modules/tr-api';

const BodySchema = z.object({
${schemaLines}
});

export const POST = withTrApi(BodySchema, async (data) => {
  return NextResponse.json({ success: true, data: ${callExpr} });
});
`;
  fs.writeFileSync(full, content, 'utf8');
  return relPath;
}

const routes = [];

// GS1
for (const [slug, fn, field] of [
  ['validate/gln', 'validateGln', 'gln'],
  ['validate/sscc', 'validateSscc', 'sscc'],
  ['validate/gsrn', 'validateGsrn', 'gsrn'],
  ['validate/grai', 'validateGrai', 'grai'],
  ['validate/gsin', 'validateGsin', 'gsin'],
  ['validate/gdti', 'validateGdti', 'gdti'],
]) {
  routes.push(writeRoute(slug, fn, `  ${field}: z.string().min(8).max(32),`, `${fn}(data.${field})`));
}

// Finance IDs
for (const [slug, fn, field] of [
  ['validate/lei', 'validateLei', 'lei'],
  ['validate/figi', 'validateFigi', 'figi'],
  ['validate/mic', 'validateMic', 'mic'],
  ['validate/wkn', 'validateWkn', 'wkn'],
  ['validate/sci', 'validateSci', 'sci'],
]) {
  routes.push(writeRoute(slug, fn, `  ${field}: z.string().min(3).max(32),`, `${fn}(data.${field})`));
}

// MRZ
routes.push(
  writeRoute(
    'validate/mrz',
    'validateMrzPassport',
    `  line1: z.string().min(40).max(50),
  line2: z.string().min(40).max(50),`,
    'validateMrzPassport(data)'
  )
);

// Checksum algorithms
routes.push(
  writeRoute(
    'validate/verhoeff',
    'verhoeffValidate',
    `  value: z.string().min(2).max(64),`,
    'verhoeffValidate(data.value)'
  )
);
routes.push(
  writeRoute(
    'validate/damm',
    'dammValidate',
    `  value: z.string().min(2).max(64),`,
    'dammValidate(data.value)'
  )
);
routes.push(
  writeRoute(
    'validate/iso7064',
    'iso7064Mod97, iso7064Mod1110',
    `  value: z.string().min(2).max(64),
  mode: z.enum(['mod97', 'mod11_10']).default('mod97'),`,
    `data.mode === 'mod11_10' ? iso7064Mod1110(data.value) : iso7064Mod97(data.value)`
  )
);

// Transport
routes.push(writeRoute('validate/awb', 'validateAwb', `  awb: z.string().min(8).max(20),`, 'validateAwb(data.awb)'));
routes.push(writeRoute('validate/imo', 'validateImo', `  imo: z.string().min(7).max(16),`, 'validateImo(data.imo)'));

// Academic
routes.push(writeRoute('validate/orcid', 'validateOrcid', `  orcid: z.string().min(10).max(24),`, 'validateOrcid(data.orcid)'));
routes.push(writeRoute('validate/isni', 'validateIsni', `  isni: z.string().min(10).max(24),`, 'validateIsni(data.isni)'));
routes.push(writeRoute('validate/doi', 'validateDoi', `  doi: z.string().min(5).max(256),`, 'validateDoi(data.doi)'));

// National IDs
routes.push(writeRoute('validate/eu-vat', 'validateEuVatJsvat', `  vat: z.string().min(4).max(24),`, 'validateEuVatJsvat(data.vat)'));
routes.push(writeRoute('validate/cpf', 'validateCpf', `  cpf: z.string().min(11).max(18),`, 'validateCpf(data.cpf)'));
routes.push(writeRoute('validate/cnpj', 'validateCnpj', `  cnpj: z.string().min(14).max(22),`, 'validateCnpj(data.cnpj)'));
routes.push(writeRoute('validate/dni', 'validateSpanishDni', `  dni: z.string().min(8).max(16),`, 'validateSpanishDni(data.dni)'));
routes.push(writeRoute('validate/aadhaar', 'validateAadhaar', `  aadhaar: z.string().min(12).max(16),`, 'validateAadhaar(data.aadhaar)'));

// Local payments
routes.push(writeRoute('validate/clabe', 'validateClabe', `  clabe: z.string().min(18).max(22),`, 'validateClabe(data.clabe)'));
routes.push(
  writeRoute(
    'validate/rib',
    'validateRib',
    `  bankCode: z.string().min(4).max(5),
  branchCode: z.string().min(4).max(5),
  accountNumber: z.string().min(10).max(12),
  ribKey: z.string().min(2).max(2).optional(),`,
    'validateRib(data)'
  )
);
routes.push(writeRoute('validate/ccc', 'validateCcc', `  ccc: z.string().min(20).max(24),`, 'validateCcc(data.ccc)'));
routes.push(writeRoute('validate/ogm', 'validateBelgiumOgm', `  ogm: z.string().min(10).max(20),`, 'validateBelgiumOgm(data.ogm)'));

// Format IDs
for (const [slug, fn, field, max] of [
  ['validate/mac', 'validateMac', 'mac', 24],
  ['validate/asn', 'validateAsn', 'asn', 16],
  ['validate/port', 'validatePort', 'port', 8],
  ['validate/iso-country', 'validateIsoCountry', 'code', 3],
  ['validate/iso-language', 'validateIsoLanguage', 'code', 8],
  ['validate/iata', 'validateIata', 'code', 3],
  ['validate/icao', 'validateIcao', 'code', 4],
  ['validate/timezone', 'validateTimezone', 'zone', 64],
  ['validate/semver', 'validateSemver', 'version', 64],
  ['validate/slug', 'validateSlug', 'slug', 128],
  ['validate/color', 'validateColorHex', 'color', 16],
  ['validate/locale', 'validateLocale', 'locale', 16],
]) {
  routes.push(
    writeRoute(slug, fn, `  ${field}: z.union([z.string().min(1).max(${max}), z.number()]),`, `${fn}(data.${field})`)
  );
}

// Open data
routes.push(
  writeRoute(
    'calendar/holidays',
    'getHolidays',
    `  country: z.string().min(2).max(3),
  year: z.number().int().min(1970).max(2100),`,
    'getHolidays(data)'
  )
);
routes.push(
  writeRoute(
    'calendar/is-holiday',
    'isHolidayDate',
    `  country: z.string().min(2).max(3),
  date: z.string().regex(/^\\d{4}-\\d{2}-\\d{2}$/),`,
    'isHolidayDate(data)'
  )
);
routes.push(
  writeRoute(
    'validate/phone-global',
    'validatePhoneGlobal',
    `  phone: z.string().min(5).max(32),
  defaultCountry: z.string().min(2).max(3).optional(),`,
    'validatePhoneGlobal(data)'
  )
);
routes.push(writeRoute('validate/tld', 'validateDomainTld', `  domain: z.string().min(3).max(253),`, 'validateDomainTld(data.domain)'));
routes.push(
  writeRoute(
    'finance/fx',
    'fetchTcmbRates',
    `  _: z.literal(true).optional(),`,
    'await fetchTcmbRates()'
  )
);
// fix fx schema — empty object
{
  const full = path.join(root, 'src/app/api/v1/finance/fx/route.ts');
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(
    full,
    `import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTrApi } from '@/modules/tr-api/routeHelper';
import { fetchTcmbRates } from '@/modules/tr-api';

const BodySchema = z.object({}).passthrough();

export const POST = withTrApi(BodySchema, async () => {
  return NextResponse.json({ success: true, data: await fetchTcmbRates() });
});
`,
    'utf8'
  );
  routes.push('finance/fx');
}

routes.push(writeRoute('validate/vin-decode', 'decodeVinNhtsa', `  vin: z.string().min(11).max(20),`, 'await decodeVinNhtsa(data.vin)'));

{
  const full = path.join(root, 'src/app/api/v1/geo/provinces/route.ts');
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(
    full,
    `import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withTrApi } from '@/modules/tr-api/routeHelper';
import { listTrProvinces } from '@/modules/tr-api';

const BodySchema = z.object({}).passthrough();

export const POST = withTrApi(BodySchema, async () => {
  return NextResponse.json({ success: true, data: { provinces: listTrProvinces() } });
});
`,
    'utf8'
  );
  routes.push('geo/provinces');
}

routes.push(
  writeRoute(
    'geo/districts',
    'fetchTurkiyeDistricts',
    `  provinceId: z.number().int().min(1).max(81),`,
    'await fetchTurkiyeDistricts(data.provinceId)'
  )
);
routes.push(
  writeRoute(
    'geo/postal',
    'lookupPostalProvince',
    `  postalCode: z.string().min(5).max(10),`,
    'lookupPostalProvince(data.postalCode)'
  )
);

// Commerce math
routes.push(
  writeRoute(
    'commerce/reorder-point',
    'reorderPoint',
    `  dailyDemand: z.number().nonnegative(),
  leadTimeDays: z.number().nonnegative(),
  safetyStock: z.number().nonnegative().optional(),
  currentStock: z.number().nonnegative(),`,
    'reorderPoint(data)'
  )
);
routes.push(
  writeRoute(
    'commerce/stripe-split',
    'stripeConnectSplit',
    `  chargeCents: z.number().int().nonnegative(),
  applicationFeeCents: z.number().int().nonnegative().optional(),
  stripeFeeCents: z.number().int().nonnegative().optional(),`,
    'stripeConnectSplit(data)'
  )
);

console.log('Wrote openData.ts +', routes.length, 'routes');
const p53 = openData.match(/id: 53[^\n]+/)?.[0];
console.log('province53:', p53);
