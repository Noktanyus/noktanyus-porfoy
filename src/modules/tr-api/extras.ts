/**
 * TR yardımcı API — ek hesaplar (tevkifat, kıdem, iş günü, sayı yazı, e-posta MX).
 * Hukuki tavsiye değildir; formül tabanlı yardımcı çıktı.
 */

import { resolveMx } from 'node:dns/promises';

const VAT_RATES = new Set([0, 1, 10, 20]);

export type WithholdingFraction =
  | '2/10'
  | '3/10'
  | '4/10'
  | '5/10'
  | '7/10'
  | '9/10'
  | '10/10';

const FRACTION_MAP: Record<WithholdingFraction, number> = {
  '2/10': 0.2,
  '3/10': 0.3,
  '4/10': 0.4,
  '5/10': 0.5,
  '7/10': 0.7,
  '9/10': 0.9,
  '10/10': 1,
};

/** KDV + tevkifat (alıcıya kalan / satıcıya ödenen ayrımı) */
export function calculateKdvWithholding(input: {
  amountCents: number;
  vatRate?: number;
  mode?: 'net' | 'gross';
  withholding?: WithholdingFraction | number;
}): {
  vatRate: number;
  mode: 'net' | 'gross';
  withholdingRate: number;
  netCents: number;
  vatCents: number;
  withholdingCents: number;
  payableToSellerCents: number;
  remittedByBuyerCents: number;
  grossCents: number;
  note: string;
} {
  const vatRate = input.vatRate ?? 20;
  if (!VAT_RATES.has(vatRate)) {
    throw new Error('vatRate yalnızca 0, 1, 10 veya 20 olabilir');
  }
  const mode = input.mode ?? 'net';
  const resolvedRate =
    typeof input.withholding === 'number'
      ? Math.min(1, Math.max(0, input.withholding))
      : input.withholding
        ? FRACTION_MAP[input.withholding]
        : 0;

  const amount = Math.max(0, Math.round(input.amountCents));
  let netCents: number;
  let vatCents: number;
  let grossCents: number;

  if (mode === 'gross') {
    grossCents = amount;
    netCents = Math.round(grossCents / (1 + vatRate / 100));
    vatCents = grossCents - netCents;
  } else {
    netCents = amount;
    vatCents = Math.round(netCents * (vatRate / 100));
    grossCents = netCents + vatCents;
  }

  const withholdingCents = Math.round(vatCents * resolvedRate);
  const remittedByBuyerCents = withholdingCents;
  const payableToSellerCents = grossCents - withholdingCents;

  return {
    vatRate,
    mode,
    withholdingRate: resolvedRate,
    netCents,
    vatCents,
    withholdingCents,
    payableToSellerCents,
    remittedByBuyerCents,
    grossCents,
    note: 'Tevkifatın fiilen uygulanıp uygulanmayacağı mükellef durumuna bağlıdır; bu çıktı hukuki görüş değildir.',
  };
}

/** 2025 H2 civarı varsayılan kıdem tavanı (kuruş) — istemci override edebilir */
export const DEFAULT_SEVERANCE_CEILING_CENTS = 4_698_214; // ~46.982,14 TL

function daysBetween(start: Date, end: Date): number {
  const ms = end.getTime() - start.getTime();
  return Math.max(0, Math.floor(ms / (24 * 60 * 60 * 1000)));
}

function noticeWeeks(serviceDays: number): number {
  if (serviceDays < 182) return 2; // < 6 ay
  if (serviceDays < 547) return 4; // < 1.5 yıl
  if (serviceDays < 1095) return 6; // < 3 yıl
  return 8;
}

/**
 * Kıdem + ihbar brüt/net yaklaşık hesap.
 * Kıdem damga vergisi %0,759; gelir vergisi kıdemde muaf kabul edilir.
 * İhbar brüt döner (gerçek stopaj kümülatif matraha bağlıdır).
 */
export function calculateSeverance(input: {
  monthlyGrossCents: number;
  startDate: string;
  endDate: string;
  severanceCeilingCents?: number;
}): {
  serviceDays: number;
  serviceYears: number;
  noticeWeeks: number;
  cappedMonthlyCents: number;
  severanceGrossCents: number;
  severanceStampTaxCents: number;
  severanceNetCents: number;
  noticeGrossCents: number;
  noticeTaxable: true;
  note: string;
} {
  const start = new Date(input.startDate);
  const end = new Date(input.endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    throw new Error('startDate / endDate geçersiz');
  }
  const serviceDays = daysBetween(start, end);
  const serviceYears = serviceDays / 365;
  const ceiling = input.severanceCeilingCents ?? DEFAULT_SEVERANCE_CEILING_CENTS;
  const monthly = Math.max(0, Math.round(input.monthlyGrossCents));
  const cappedMonthlyCents = Math.min(monthly, ceiling);
  const severanceGrossCents = Math.round(cappedMonthlyCents * serviceYears);
  const severanceStampTaxCents = Math.round(severanceGrossCents * 0.00759);
  const severanceNetCents = severanceGrossCents - severanceStampTaxCents;
  const weeks = noticeWeeks(serviceDays);
  const daily = cappedMonthlyCents / 30;
  const noticeGrossCents = Math.round(daily * weeks * 7);

  return {
    serviceDays,
    serviceYears: Math.round(serviceYears * 1000) / 1000,
    noticeWeeks: weeks,
    cappedMonthlyCents,
    severanceGrossCents,
    severanceStampTaxCents,
    severanceNetCents,
    noticeGrossCents,
    noticeTaxable: true,
    note: 'Hukuki hak doğumu (haklı fesih vb.) değerlendirilmez. İhbar stopajı kümülatif matraha bağlıdır.',
  };
}

/** Sabit ulusal tatiller + bilinen dini bayram günleri (2025–2027) */
const EXTRA_HOLIDAYS: Record<string, string[]> = {
  '2025': [
    '2025-01-01',
    '2025-03-29', // Arefe (Ramazan) — yarım gün; tam gün sayıyoruz
    '2025-03-30',
    '2025-03-31',
    '2025-04-01',
    '2025-04-23',
    '2025-05-01',
    '2025-05-19',
    '2025-06-05', // Arefe (Kurban)
    '2025-06-06',
    '2025-06-07',
    '2025-06-08',
    '2025-06-09',
    '2025-07-15',
    '2025-08-30',
    '2025-10-29',
  ],
  '2026': [
    '2026-01-01',
    '2026-03-19',
    '2026-03-20',
    '2026-03-21',
    '2026-03-22',
    '2026-04-23',
    '2026-05-01',
    '2026-05-19',
    '2026-05-26',
    '2026-05-27',
    '2026-05-28',
    '2026-05-29',
    '2026-05-30',
    '2026-07-15',
    '2026-08-30',
    '2026-10-29',
  ],
  '2027': [
    '2027-01-01',
    '2027-03-09',
    '2027-03-10',
    '2027-03-11',
    '2027-03-12',
    '2027-04-23',
    '2027-05-01',
    '2027-05-16',
    '2027-05-17',
    '2027-05-18',
    '2027-05-19',
    '2027-07-15',
    '2027-08-30',
    '2027-10-29',
  ],
};

function toYmd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function holidaySet(from: Date, to: Date): Set<string> {
  const set = new Set<string>();
  const y0 = from.getUTCFullYear();
  const y1 = to.getUTCFullYear();
  for (let y = y0; y <= y1; y++) {
    for (const day of EXTRA_HOLIDAYS[String(y)] ?? []) {
      set.add(day);
    }
    // Yıllar tabloda yoksa en azından sabit tatilleri ekle
    if (!EXTRA_HOLIDAYS[String(y)]) {
      for (const md of ['01-01', '04-23', '05-01', '05-19', '07-15', '08-30', '10-29']) {
        set.add(`${y}-${md}`);
      }
    }
  }
  return set;
}

export function calculateBusinessDays(input: {
  startDate: string;
  endDate: string;
  includeStart?: boolean;
  includeEnd?: boolean;
}): {
  startDate: string;
  endDate: string;
  calendarDays: number;
  businessDays: number;
  weekendDays: number;
  holidayDays: number;
  holidaysTouched: string[];
} {
  const start = new Date(input.startDate + 'T00:00:00.000Z');
  const end = new Date(input.endDate + 'T00:00:00.000Z');
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    throw new Error('startDate / endDate geçersiz (YYYY-MM-DD)');
  }
  const includeStart = input.includeStart ?? true;
  const includeEnd = input.includeEnd ?? true;
  const holidays = holidaySet(start, end);
  const holidaysTouched: string[] = [];
  let businessDays = 0;
  let weekendDays = 0;
  let holidayDays = 0;
  let calendarDays = 0;

  const cursor = new Date(start);
  while (cursor <= end) {
    const ymd = toYmd(cursor);
    const isStart = cursor.getTime() === start.getTime();
    const isEnd = cursor.getTime() === end.getTime();
    const shouldCount = (!isStart || includeStart) && (!isEnd || includeEnd);

    if (shouldCount) {
      calendarDays += 1;
      const dow = cursor.getUTCDay();
      const isWeekend = dow === 0 || dow === 6;
      const isHoliday = holidays.has(ymd);
      if (isHoliday) {
        holidayDays += 1;
        holidaysTouched.push(ymd);
      }
      if (isWeekend) weekendDays += 1;
      if (!isWeekend && !isHoliday) businessDays += 1;
    }

    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return {
    startDate: toYmd(start),
    endDate: toYmd(end),
    calendarDays,
    businessDays,
    weekendDays,
    holidayDays,
    holidaysTouched: [...new Set(holidaysTouched)],
  };
}

export function isTurkishBusinessDay(date: string): {
  date: string;
  isBusinessDay: boolean;
  isWeekend: boolean;
  isHoliday: boolean;
} {
  const d = new Date(date + 'T00:00:00.000Z');
  if (Number.isNaN(d.getTime())) throw new Error('date geçersiz (YYYY-MM-DD)');
  const ymd = toYmd(d);
  const holidays = holidaySet(d, d);
  const dow = d.getUTCDay();
  const isWeekend = dow === 0 || dow === 6;
  const isHoliday = holidays.has(ymd);
  return {
    date: ymd,
    isBusinessDay: !isWeekend && !isHoliday,
    isWeekend,
    isHoliday,
  };
}

export function nextBusinessDay(input: {
  date: string;
  count?: number;
}): { startDate: string; resultDate: string; steps: number } {
  const count = Math.max(1, Math.min(3650, input.count ?? 1));
  let d = new Date(input.date + 'T00:00:00.000Z');
  if (Number.isNaN(d.getTime())) throw new Error('date geçersiz');
  let added = 0;
  let guard = 0;
  while (added < count && guard < 10000) {
    d.setUTCDate(d.getUTCDate() + 1);
    const ymd = toYmd(d);
    if (isTurkishBusinessDay(ymd).isBusinessDay) added += 1;
    guard += 1;
  }
  return { startDate: input.date, resultDate: toYmd(d), steps: added };
}

export function addBusinessDays(input: {
  date: string;
  days: number;
}): { startDate: string; resultDate: string; businessDaysAdded: number } {
  const days = Math.trunc(input.days);
  if (days === 0) return { startDate: input.date, resultDate: input.date, businessDaysAdded: 0 };
  if (days > 0) {
    const r = nextBusinessDay({ date: input.date, count: days });
    return { startDate: input.date, resultDate: r.resultDate, businessDaysAdded: days };
  }
  let d = new Date(input.date + 'T00:00:00.000Z');
  let left = Math.abs(days);
  let guard = 0;
  while (left > 0 && guard < 10000) {
    d.setUTCDate(d.getUTCDate() - 1);
    if (isTurkishBusinessDay(toYmd(d)).isBusinessDay) left -= 1;
    guard += 1;
  }
  return { startDate: input.date, resultDate: toYmd(d), businessDaysAdded: days };
}

export function bistTradingDays(input: { year: number }): {
  year: number;
  tradingDays: string[];
  count: number;
} {
  const year = input.year;
  if (year < 2000 || year > 2100) throw new Error('year 2000–2100');
  const start = new Date(Date.UTC(year, 0, 1));
  const end = new Date(Date.UTC(year, 11, 31));
  const days: string[] = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    const ymd = toYmd(cursor);
    if (isTurkishBusinessDay(ymd).isBusinessDay) days.push(ymd);
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return { year, tradingDays: days, count: days.length };
}

export function calculateTebligatClock(input: {
  notifiedAt: string;
  days?: number;
  mode?: 'calendar' | 'business';
}): {
  notifiedAt: string;
  deadline: string;
  days: number;
  mode: string;
  note: string;
} {
  const days = Math.max(1, Math.min(365, input.days ?? 15));
  const mode = input.mode ?? 'calendar';
  const start = new Date(input.notifiedAt + 'T00:00:00.000Z');
  if (Number.isNaN(start.getTime())) throw new Error('notifiedAt geçersiz');

  let deadline: string;
  if (mode === 'business') {
    deadline = nextBusinessDay({ date: toYmd(start), count: days }).resultDate;
  } else {
    const d = new Date(start);
    d.setUTCDate(d.getUTCDate() + days);
    let ymd = toYmd(d);
    let guard = 0;
    while (!isTurkishBusinessDay(ymd).isBusinessDay && guard < 14) {
      d.setUTCDate(d.getUTCDate() + 1);
      ymd = toYmd(d);
      guard += 1;
    }
    deadline = ymd;
  }

  return {
    notifiedAt: toYmd(start),
    deadline,
    days,
    mode,
    note: 'Basitleştirilmiş tebligat saati; somut uyuşmazlık için hukuki değerlendirme gerekir.',
  };
}

const ONES = ['', 'bir', 'iki', 'üç', 'dört', 'beş', 'altı', 'yedi', 'sekiz', 'dokuz'];
const TENS = ['', 'on', 'yirmi', 'otuz', 'kırk', 'elli', 'altmış', 'yetmiş', 'seksen', 'doksan'];
const SCALES = ['', 'bin', 'milyon', 'milyar', 'trilyon'];

function threeDigitsToWords(n: number): string {
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  const tens = Math.floor(rest / 10);
  const ones = rest % 10;
  const parts: string[] = [];
  if (hundreds === 1) parts.push('yüz');
  else if (hundreds > 1) parts.push(`${ONES[hundreds]} yüz`);
  if (tens) parts.push(TENS[tens]!);
  if (ones) parts.push(ONES[ones]!);
  return parts.join(' ').trim();
}

function integerToTurkishWords(n: number): string {
  if (n === 0) return 'sıfır';
  const parts: string[] = [];
  let scale = 0;
  let remaining = n;
  while (remaining > 0) {
    const chunk = remaining % 1000;
    if (chunk > 0) {
      let chunkWords = threeDigitsToWords(chunk);
      const scaleName = SCALES[scale] ?? '';
      if (scale === 1 && chunk === 1) {
        chunkWords = 'bin';
      } else if (scaleName) {
        chunkWords = `${chunkWords} ${scaleName}`.trim();
      }
      parts.unshift(chunkWords);
    }
    remaining = Math.floor(remaining / 1000);
    scale += 1;
  }
  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

/** Tutar → Türkçe yazı (çek/senet biçimi opsiyonel) */
export function amountToTurkishWords(input: {
  amountCents: number;
  currency?: 'TRY' | 'USD' | 'EUR' | 'GBP';
  uppercaseCompact?: boolean;
}): {
  amountCents: number;
  currency: string;
  words: string;
  compact?: string;
} {
  const currency = input.currency ?? 'TRY';
  const amount = Math.max(0, Math.round(input.amountCents));
  const whole = Math.floor(amount / 100);
  const frac = amount % 100;
  const major =
    currency === 'TRY' ? 'Türk Lirası' : currency === 'USD' ? 'Amerikan Doları' : currency === 'EUR' ? 'Euro' : 'Sterlin';
  const minor = currency === 'TRY' ? 'Kuruş' : 'Cent';

  const wholeWords = integerToTurkishWords(whole);
  const fracWords = integerToTurkishWords(frac);
  const words =
    frac === 0
      ? `${wholeWords} ${major}`
      : `${wholeWords} ${major} ${fracWords} ${minor}`;

  const compact = input.uppercaseCompact
    ? words
        .toLocaleUpperCase('tr-TR')
        .replace(/[^A-ZÇĞİÖŞÜ0-9]/gi, '')
    : undefined;

  return { amountCents: amount, currency, words, ...(compact ? { compact } : {}) };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

/** Format + MX kaydı (SMTP handshake yok) */
export async function validateEmailMx(raw: string): Promise<{
  valid: boolean;
  normalized: string;
  domain?: string;
  hasMx?: boolean;
  mxHosts?: string[];
  reason?: string;
}> {
  const normalized = raw.trim().toLowerCase();
  if (!EMAIL_RE.test(normalized)) {
    return { valid: false, normalized, reason: 'E-posta formatı geçersiz' };
  }
  const domain = normalized.split('@')[1]!;
  try {
    const records = await resolveMx(domain);
    if (!records.length) {
      return { valid: false, normalized, domain, hasMx: false, reason: 'MX kaydı yok' };
    }
    const mxHosts = records
      .sort((a, b) => a.priority - b.priority)
      .map((r) => r.exchange);
    return { valid: true, normalized, domain, hasMx: true, mxHosts };
  } catch {
    return { valid: false, normalized, domain, hasMx: false, reason: 'DNS / MX sorgu başarısız' };
  }
}
