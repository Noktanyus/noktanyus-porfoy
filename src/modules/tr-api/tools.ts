/**
 * Lisanssız yardımcılar: birim, hicri, adres parse, MERSİS/KEP.
 */

const PROVINCES: Record<string, string> = {
  adana: '01',
  adıyaman: '02',
  afyon: '03',
  afyonkarahisar: '03',
  ağrı: '04',
  amasya: '05',
  ankara: '06',
  antalya: '07',
  artvin: '08',
  aydın: '09',
  balıkesir: '10',
  bilecik: '11',
  bingöl: '12',
  bitlis: '13',
  bolu: '14',
  burdur: '15',
  bursa: '16',
  çanakkale: '17',
  çankırı: '18',
  çorum: '19',
  denizli: '20',
  diyarbakır: '21',
  edirne: '22',
  elazığ: '23',
  erzincan: '24',
  erzurum: '25',
  eskişehir: '26',
  gaziantep: '27',
  giresun: '28',
  gümüşhane: '29',
  hakkari: '30',
  hatay: '31',
  ısparta: '32',
  isparta: '32',
  mersin: '33',
  içel: '33',
  istanbul: '34',
  i̇stanbul: '34',
  izmir: '35',
  i̇zmir: '35',
  kars: '36',
  kastamonu: '37',
  kayseri: '38',
  kırklareli: '39',
  kırşehir: '40',
  kocaeli: '41',
  konya: '42',
  kütahya: '43',
  malatya: '44',
  manisa: '45',
  kahramanmaraş: '46',
  mardin: '47',
  muğla: '48',
  muş: '49',
  nevşehir: '50',
  niğde: '51',
  ordu: '52',
  rize: '53',
  sakarya: '54',
  samsun: '55',
  siirt: '56',
  sinop: '57',
  sivas: '58',
  tekirdağ: '59',
  tokat: '60',
  trabzon: '61',
  tunceli: '62',
  şanlıurfa: '63',
  uşak: '64',
  van: '65',
  yozgat: '66',
  zonguldak: '67',
  aksaray: '68',
  bayburt: '69',
  karaman: '70',
  kırıkkale: '71',
  batman: '72',
  şırnak: '73',
  bartın: '74',
  ardahan: '75',
  ığdır: '76',
  yalova: '77',
  karabük: '78',
  kilis: '79',
  osmaniye: '80',
  düzce: '81',
};

function normTr(s: string): string {
  return s
    .toLocaleLowerCase('tr-TR')
    .normalize('NFC')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Heuristik TR adres satırı parse — resmi kadastro değildir */
export function parseTurkishAddress(raw: string): {
  raw: string;
  province?: string;
  provinceCode?: string;
  district?: string;
  neighborhood?: string;
  postalCode?: string;
  street?: string;
  note: string;
} {
  const text = raw.trim();
  const postal = text.match(/\b(\d{5})\b/);
  let province: string | undefined;
  let provinceCode: string | undefined;
  const lower = normTr(text);
  for (const [name, code] of Object.entries(PROVINCES)) {
    if (lower.includes(normTr(name))) {
      province = name.charAt(0).toLocaleUpperCase('tr-TR') + name.slice(1);
      provinceCode = code;
      break;
    }
  }
  const mahalle = text.match(/([A-Za-zÇĞİÖŞÜçğıöşü\s]+?)\s*(Mah\.|Mahallesi)/i);
  const districtMatch = text.match(/([A-Za-zÇĞİÖŞÜçğıöşü\s]+?)\s*(İlçesi|\/)/i);
  return {
    raw: text,
    province,
    provinceCode,
    district: districtMatch?.[1]?.trim(),
    neighborhood: mahalle?.[1]?.trim(),
    postalCode: postal?.[1],
    street: text.split(',')[0]?.trim(),
    note: 'Heuristik parse; resmi adres doğrulaması değildir.',
  };
}

/** MERSİS: 16 hane */
export function validateMersis(raw: string): { valid: boolean; normalized: string; reason?: string } {
  const normalized = raw.replace(/\s+/g, '');
  if (!/^\d{16}$/.test(normalized)) {
    return { valid: false, normalized, reason: 'MERSİS 16 haneli olmalıdır' };
  }
  return { valid: true, normalized };
}

/** KEP: *@hs01.kep.tr vb. */
export function validateKep(raw: string): { valid: boolean; normalized: string; reason?: string } {
  const normalized = raw.trim().toLowerCase();
  if (!/^[a-z0-9._%+-]+@[a-z0-9.-]+\.kep\.tr$/i.test(normalized)) {
    return { valid: false, normalized, reason: 'KEP adresi *@…kep.tr biçiminde olmalıdır' };
  }
  return { valid: true, normalized };
}

/** Kuwaiti algorithm-ish Gregorian ↔ Hijri approximate */
export function convertHijriGregorian(input: {
  from: 'gregorian' | 'hijri';
  year: number;
  month: number;
  day: number;
}): {
  from: string;
  to: string;
  year: number;
  month: number;
  day: number;
  note: string;
} {
  const { year: y, month: m, day: d } = input;
  if (m < 1 || m > 12 || d < 1 || d > 31) throw new Error('Geçersiz tarih');

  if (input.from === 'gregorian') {
    // Approx Julian Day Number
    const a = Math.floor((14 - m) / 12);
    const y2 = y + 4800 - a;
    const m2 = m + 12 * a - 3;
    const jd =
      d +
      Math.floor((153 * m2 + 2) / 5) +
      365 * y2 +
      Math.floor(y2 / 4) -
      Math.floor(y2 / 100) +
      Math.floor(y2 / 400) -
      32045;
    const l = jd - 1948440 + 10632;
    const n = Math.floor((l - 1) / 10631);
    const l2 = l - 10631 * n + 354;
    const j =
      Math.floor((10985 - l2) / 5316) * Math.floor((50 * l2) / 17719) +
      Math.floor(l2 / 5670) * Math.floor((43 * l2) / 15238);
    const l3 = l2 - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) - Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
    const month = Math.floor((24 * l3) / 709);
    const day = l3 - Math.floor((709 * month) / 24);
    const year = 30 * n + j - 30;
    return {
      from: 'gregorian',
      to: 'hijri',
      year,
      month,
      day,
      note: 'Yaklaşık dönüşüm; resmi dini takvim için Diyanet kaynağı tercih edilir.',
    };
  }

  // hijri → gregorian (inverse approx)
  const jd =
    Math.floor((11 * y + 3) / 30) +
    354 * y +
    30 * m -
    Math.floor((m - 1) / 2) +
    d +
    1948440 -
    385;
  let l = jd + 68569;
  const n = Math.floor((4 * l) / 146097);
  l = l - Math.floor((146097 * n + 3) / 4);
  const i = Math.floor((4000 * (l + 1)) / 1461001);
  l = l - Math.floor((1461 * i) / 4) + 31;
  const j = Math.floor((80 * l) / 2447);
  const day = l - Math.floor((2447 * j) / 80);
  l = Math.floor(j / 11);
  const month = j + 2 - 12 * l;
  const year = 100 * (n - 49) + i + l;
  return {
    from: 'hijri',
    to: 'gregorian',
    year,
    month,
    day,
    note: 'Yaklaşık dönüşüm; resmi dini takvim için Diyanet kaynağı tercih edilir.',
  };
}

type UnitCat = 'length' | 'mass' | 'temperature' | 'area' | 'volume';

const FACTORS: Record<UnitCat, Record<string, number>> = {
  length: { m: 1, km: 1000, cm: 0.01, mm: 0.001, mi: 1609.344, ft: 0.3048, in: 0.0254 },
  mass: { kg: 1, g: 0.001, mg: 0.000001, lb: 0.45359237, oz: 0.028349523125, t: 1000 },
  temperature: {}, // special
  area: { m2: 1, km2: 1e6, ha: 10000, acre: 4046.8564224, ft2: 0.09290304 },
  volume: { l: 1, ml: 0.001, m3: 1000, gal: 3.785411784 },
};

export function convertUnit(input: {
  category: UnitCat;
  from: string;
  to: string;
  value: number;
}): { category: string; from: string; to: string; value: number; result: number } {
  const { category, from, to, value } = input;
  if (category === 'temperature') {
    let c: number;
    if (from === 'C') c = value;
    else if (from === 'F') c = ((value - 32) * 5) / 9;
    else if (from === 'K') c = value - 273.15;
    else throw new Error('from: C|F|K');
    let result: number;
    if (to === 'C') result = c;
    else if (to === 'F') result = (c * 9) / 5 + 32;
    else if (to === 'K') result = c + 273.15;
    else throw new Error('to: C|F|K');
    return { category, from, to, value, result };
  }
  const table = FACTORS[category];
  if (!table[from] || !table[to]) throw new Error(`Desteklenmeyen birim: ${from}/${to}`);
  const base = value * table[from]!;
  const result = base / table[to]!;
  return { category, from, to, value, result };
}
