/**
 * TR e-ticaret yardımcı API — format doğrulama + fatura PDF metni.
 * GİB e-fatura değildir; yerel doğrulama ve PDF üretimi.
 */

/** TCKN: 11 hane, ilk hane 0 olamaz, checksum kuralları */
export function validateTckn(raw: string): { valid: boolean; normalized: string; reason?: string } {
  const normalized = raw.replace(/\s+/g, '');
  if (!/^\d{11}$/.test(normalized)) {
    return { valid: false, normalized, reason: 'TCKN 11 haneli olmalıdır' };
  }
  if (normalized[0] === '0') {
    return { valid: false, normalized, reason: 'TCKN 0 ile başlayamaz' };
  }
  const d = normalized.split('').map(Number);
  const odd = d[0]! + d[2]! + d[4]! + d[6]! + d[8]!;
  const even = d[1]! + d[3]! + d[5]! + d[7]!;
  const dig10 = ((odd * 7 - even) % 10 + 10) % 10;
  if (dig10 !== d[9]) {
    return { valid: false, normalized, reason: 'TCKN 10. hane kontrolü başarısız' };
  }
  const dig11 = d.slice(0, 10).reduce((a, b) => a + b, 0) % 10;
  if (dig11 !== d[10]) {
    return { valid: false, normalized, reason: 'TCKN 11. hane kontrolü başarısız' };
  }
  return { valid: true, normalized };
}

/** VKN: 10 hane, algoritmik kontrol */
export function validateVkn(raw: string): { valid: boolean; normalized: string; reason?: string } {
  const normalized = raw.replace(/\s+/g, '');
  if (!/^\d{10}$/.test(normalized)) {
    return { valid: false, normalized, reason: 'VKN 10 haneli olmalıdır' };
  }
  const digits = normalized.split('').map(Number);
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    const tmp = (digits[i]! + (9 - i)) % 10;
    sum += (tmp * Math.pow(2, 9 - i)) % 9;
    if (tmp !== 0 && (tmp * Math.pow(2, 9 - i)) % 9 === 0) {
      sum += 9;
    }
  }
  const check = (10 - (sum % 10)) % 10;
  if (check !== digits[9]) {
    return { valid: false, normalized, reason: 'VKN kontrol hanesi geçersiz' };
  }
  return { valid: true, normalized };
}

/** TR IBAN: TR + 24 hane, MOD-97 */
export function validateIban(raw: string): { valid: boolean; normalized: string; reason?: string } {
  const normalized = raw.replace(/\s+/g, '').toUpperCase();
  if (!/^TR\d{24}$/.test(normalized)) {
    return { valid: false, normalized, reason: 'TR IBAN TR + 24 rakam olmalıdır' };
  }
  const rearranged = normalized.slice(4) + normalized.slice(0, 4);
  const expanded = rearranged.replace(/[A-Z]/g, (ch) => String(ch.charCodeAt(0) - 55));
  let remainder = 0;
  for (const ch of expanded) {
    remainder = (remainder * 10 + Number(ch)) % 97;
  }
  if (remainder !== 1) {
    return { valid: false, normalized, reason: 'IBAN MOD-97 kontrolü başarısız' };
  }
  return { valid: true, normalized };
}

/** TR cep / sabit hat — yapısal doğrulama (operatör kaydı değil) */
export function validatePhone(
  raw: string,
  type: 'any' | 'mobile' | 'landline' = 'any'
): {
  valid: boolean;
  normalized: string;
  e164?: string;
  kind?: 'mobile' | 'landline';
  reason?: string;
} {
  const digits = raw.replace(/\D/g, '');
  let national = digits;
  if (national.startsWith('90') && national.length === 12) {
    national = national.slice(2);
  }
  if (national.startsWith('0') && national.length === 11) {
    national = national.slice(1);
  }
  if (!/^\d{10}$/.test(national)) {
    return { valid: false, normalized: national, reason: 'TR telefon 10 haneli olmalıdır' };
  }
  const isMobile = national.startsWith('5');
  const isLandline = /^[2-4]/.test(national);
  if (type === 'mobile' && !isMobile) {
    return { valid: false, normalized: national, reason: 'Cep numarası 5 ile başlamalıdır' };
  }
  if (type === 'landline' && !isLandline) {
    return { valid: false, normalized: national, reason: 'Sabit hat 2–4 ile başlamalıdır' };
  }
  if (!isMobile && !isLandline) {
    return { valid: false, normalized: national, reason: 'Geçersiz TR telefon öneki' };
  }
  return {
    valid: true,
    normalized: national,
    e164: `+90${national}`,
    kind: isMobile ? 'mobile' : 'landline',
  };
}

const PROVINCE_CODES = new Set(
  Array.from({ length: 81 }, (_, i) => String(i + 1).padStart(2, '0'))
);

/** 5 haneli posta kodu — ilk 2 hane il plaka kodu */
export function validatePostalCode(raw: string): {
  valid: boolean;
  normalized: string;
  provinceCode?: string;
  reason?: string;
} {
  const normalized = raw.replace(/\s+/g, '');
  if (!/^\d{5}$/.test(normalized)) {
    return { valid: false, normalized, reason: 'Posta kodu 5 haneli olmalıdır' };
  }
  const provinceCode = normalized.slice(0, 2);
  if (!PROVINCE_CODES.has(provinceCode)) {
    return { valid: false, normalized, reason: 'İl plaka kodu 01–81 arasında olmalıdır' };
  }
  return { valid: true, normalized, provinceCode };
}

/** Plaka: 01–81 + harf + rakam */
export function validatePlate(raw: string): { valid: boolean; normalized: string; reason?: string } {
  const normalized = raw.replace(/\s+/g, '').toUpperCase();
  if (!/^(0[1-9]|[1-7][0-9]|8[01])[A-Z]{1,3}\d{2,4}$/.test(normalized)) {
    return { valid: false, normalized, reason: 'Geçersiz plaka formatı (örn. 34ABC123)' };
  }
  return { valid: true, normalized };
}

/** KDV hesaplama — net veya brüt üzerinden */
export function calculateKdv(input: {
  amountCents: number;
  vatRate?: number;
  mode?: 'net' | 'gross';
}): {
  vatRate: number;
  mode: 'net' | 'gross';
  netCents: number;
  vatCents: number;
  grossCents: number;
} {
  const vatRate = input.vatRate ?? 20;
  const mode = input.mode ?? 'net';
  const amount = Math.max(0, Math.round(input.amountCents));
  if (mode === 'gross') {
    const grossCents = amount;
    const netCents = Math.round(grossCents / (1 + vatRate / 100));
    const vatCents = grossCents - netCents;
    return { vatRate, mode, netCents, vatCents, grossCents };
  }
  const netCents = amount;
  const vatCents = Math.round(netCents * (vatRate / 100));
  const grossCents = netCents + vatCents;
  return { vatRate, mode, netCents, vatCents, grossCents };
}

/** IBAN banka kodu → Türkiye bankaları ve FAST lisanslı kuruluşlar */
export const IBAN_BANKS: Record<string, string> = {
  // Merkez & Kamu / Kalkınma Bankaları
  '00001': 'T.C. Merkez Bankası',
  '00004': 'İller Bankası (İLBANK)',
  '00010': 'T.C. Ziraat Bankası',
  '00012': 'Türkiye Halk Bankası (Halkbank)',
  '00013': 'Türkiye Kalkınma ve Yatırım Bankası',
  '00015': 'Türkiye Vakıflar Bankası (VakıfBank)',
  '00029': 'Türk Eximbank',

  // Özel & Yabancı Sermayeli Mevduat Bankaları
  '00032': 'Türk Ekonomi Bankası (TEB)',
  '00046': 'Akbank',
  '00059': 'Şekerbank',
  '00060': 'Türk Ticaret Bankası',
  '00061': 'Garanti BBVA',
  '00062': 'Garanti BBVA',
  '00064': 'Türkiye İş Bankası',
  '00067': 'Yapı ve Kredi Bankası',
  '00091': 'Arap Türk Bankası',
  '00092': 'Citibank',
  '00096': 'Bank Mellat',
  '00099': 'ING',
  '00100': 'JPMorgan Chase Bank',
  '00103': 'Fibabanka',
  '00108': 'Turkland Bank (T-Bank)',
  '00109': 'ICBC Turkey Bank',
  '00111': 'QNB Bank (QNB Finansbank)',
  '00115': 'Deutsche Bank',
  '00116': 'Societe Generale',
  '00121': 'Standard Chartered Yatırım Bankası',
  '00122': 'Habib Bank Limited',
  '00123': 'HSBC Bank',
  '00124': 'Alternatifbank',
  '00125': 'Burgan Bank',
  '00134': 'Denizbank',
  '00135': 'Anadolubank',
  '00146': 'Odea Bank',

  // Yatırım ve Kalkınma Bankaları
  '00138': 'Diler Yatırım Bankası',
  '00139': 'GSD Yatırım Bankası',
  '00141': 'Nurol Yatırım Bankası',
  '00142': 'BankPozitif Kredi ve Kalkınma Bankası',
  '00143': 'Aktif Yatırım Bankası (Aktif Bank / N Kolay)',
  '00144': 'Rabobank',
  '00145': 'PASHA Yatırım Bankası',
  '00147': 'MUFG Bank Turkey',
  '00148': 'Bank of China Turkey',
  '00150': 'Golden Global Yatırım Bankası',
  '00152': 'Destek Yatırım Bankası',
  '00153': 'Misyon Yatırım Bankası',
  '00154': 'Tera Yatırım Bankası',

  // Dijital Bankalar (BDDK Lisanslı)
  '00157': 'Enpara Bank',
  '00158': 'Colendi Bank',
  '00159': 'FUPS Bank',
  '00160': 'Ziraat Dinamik Banka',

  // Katılım Bankaları
  '00203': 'Albaraka Türk Katılım Bankası',
  '00205': 'Kuveyt Türk Katılım Bankası',
  '00206': 'Türkiye Finans Katılım Bankası',
  '00209': 'Ziraat Katılım Bankası',
  '00210': 'Vakıf Katılım Bankası',
  '00211': 'Türkiye Emlak Katılım Bankası',
  '00212': 'Hayat Finans Katılım Bankası',
  '00213': 'T.O.M. Katılım Bankası (TOM Bank)',
  '00214': 'Dünya Katılım Bankası',

  // Takas, Saklama & Posta Kuruluşları
  '00800': 'İstanbul Takas ve Saklama Bankası (Takasbank)',
  '00807': 'PTT (Posta ve Telgraf Teşkilatı)',

  // TCMB FAST Doğrudan Katılımcısı Ödeme ve Elektronik Para Kuruluşları
  '00825': 'Moka United Ödeme Kuruluşu',
  '00827': 'Param (Turk Elektronik Para)',
  '00828': 'Belbim Elektronik Para (İstanbulkart)',
  '00829': 'Papara Elektronik Para',
  '00838': 'Sipay Elektronik Para',
  '00850': 'BPN Ödeme ve Elektronik Para',
  '00864': 'İyzico (İyzi Ödeme)',
  '00869': 'Paycell (Turkcell Ödeme)',
  '00890': 'Lydians Elektronik Para',
  '00894': 'Ahlatcı Ödeme ve Elektronik Para',
  '00911': 'AS Ödeme Hizmetleri',
};

export function resolveIbanBank(raw: string): {
  valid: boolean;
  normalized: string;
  bankCode?: string;
  bankName?: string;
  isKnown?: boolean;
  reason?: string;
} {
  const check = validateIban(raw);
  if (!check.valid) {
    return { valid: false, normalized: check.normalized, reason: check.reason };
  }
  const bankCode = check.normalized.slice(4, 9);
  const matched = IBAN_BANKS[bankCode];
  const bankName = matched ?? 'Bilinmeyen / diğer banka';
  const isKnown = Boolean(matched);
  return { valid: true, normalized: check.normalized, bankCode, bankName, isKnown };
}

export interface InvoiceLine {
  description: string;
  quantity: number;
  unitPriceCents: number;
  vatRate?: number;
}

export interface InvoicePdfInput {
  sellerName: string;
  sellerTaxId?: string;
  buyerName: string;
  buyerTaxId?: string;
  invoiceNumber: string;
  issueDate?: string;
  currency?: string;
  lines: InvoiceLine[];
  notes?: string;
}

/** Basit PDF (metin tabanlı) — harici bağımlılık yok */
export function buildInvoicePdf(input: InvoicePdfInput): Buffer {
  const currency = (input.currency ?? 'TRY').toUpperCase();
  const date = input.issueDate ?? new Date().toISOString().slice(0, 10);
  const lines: string[] = [
    'FATURA / TEKLIF',
    `No: ${input.invoiceNumber}`,
    `Tarih: ${date}`,
    '',
    `Satici: ${input.sellerName}${input.sellerTaxId ? ` (VKN/TCKN: ${input.sellerTaxId})` : ''}`,
    `Alici: ${input.buyerName}${input.buyerTaxId ? ` (VKN/TCKN: ${input.buyerTaxId})` : ''}`,
    '',
    'Kalemler:',
  ];

  let subtotal = 0;
  let vatTotal = 0;
  for (const line of input.lines) {
    const lineTotal = Math.round(line.quantity * line.unitPriceCents);
    const vat = Math.round(lineTotal * ((line.vatRate ?? 20) / 100));
    subtotal += lineTotal;
    vatTotal += vat;
    lines.push(
      `- ${line.description} x${line.quantity} @ ${(line.unitPriceCents / 100).toFixed(2)} = ${(lineTotal / 100).toFixed(2)} ${currency} (KDV ${line.vatRate ?? 20}%)`
    );
  }
  lines.push('');
  lines.push(`Ara toplam: ${(subtotal / 100).toFixed(2)} ${currency}`);
  lines.push(`KDV: ${(vatTotal / 100).toFixed(2)} ${currency}`);
  lines.push(`Genel toplam: ${((subtotal + vatTotal) / 100).toFixed(2)} ${currency}`);
  if (input.notes) {
    lines.push('');
    lines.push(`Not: ${input.notes}`);
  }
  lines.push('');
  lines.push('(Bu belge GIB e-fatura degildir. Bilgilendirme / teklif PDF.)');

  return textToSimplePdf(lines.join('\n'));
}

function textToSimplePdf(text: string): Buffer {
  const escaped = text
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/\r/g, '');
  const contentLines = escaped.split('\n');
  const contentStreamParts: string[] = ['BT', '/F1 10 Tf', '50 780 Td', '14 TL'];
  for (let i = 0; i < contentLines.length; i++) {
    if (i === 0) {
      contentStreamParts.push(`(${contentLines[i]}) Tj`);
    } else {
      contentStreamParts.push('T*');
      contentStreamParts.push(`(${contentLines[i]}) Tj`);
    }
  }
  contentStreamParts.push('ET');
  const stream = contentStreamParts.join('\n');
  const streamLen = Buffer.byteLength(stream, 'utf8');

  const objects: string[] = [];
  objects.push('1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj');
  objects.push('2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj');
  objects.push(
    '3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>endobj'
  );
  objects.push(`4 0 obj<< /Length ${streamLen} >>stream\n${stream}\nendstream\nendobj`);
  objects.push('5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj');

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0];
  for (const obj of objects) {
    offsets.push(Buffer.byteLength(pdf, 'utf8'));
    pdf += obj + '\n';
  }
  const xrefPos = Buffer.byteLength(pdf, 'utf8');
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i < offsets.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
  pdf += `startxref\n${xrefPos}\n%%EOF`;
  return Buffer.from(pdf, 'utf8');
}

/** Kart numarası Luhn (PAN) — kart tipi tahmini yok, CVV yok */
export function validateCardLuhn(raw: string): {
  valid: boolean;
  normalized: string;
  reason?: string;
} {
  const normalized = raw.replace(/[\s-]/g, '');
  if (!/^\d{13,19}$/.test(normalized)) {
    return { valid: false, normalized, reason: 'Kart numarası 13–19 haneli olmalıdır' };
  }
  let sum = 0;
  let alt = false;
  for (let i = normalized.length - 1; i >= 0; i--) {
    let n = Number(normalized[i]);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  if (sum % 10 !== 0) {
    return { valid: false, normalized, reason: 'Luhn kontrolü başarısız' };
  }
  return { valid: true, normalized };
}

/** IMEI: 15 hane Luhn */
export function validateImei(raw: string): { valid: boolean; normalized: string; reason?: string } {
  const normalized = raw.replace(/\s+/g, '');
  if (!/^\d{15}$/.test(normalized)) {
    return { valid: false, normalized, reason: 'IMEI 15 haneli olmalıdır' };
  }
  const body = normalized.slice(0, 14);
  const check = Number(normalized[14]);
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    let n = Number(body[i]);
    if (i % 2 === 1) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
  }
  const expected = (10 - (sum % 10)) % 10;
  if (expected !== check) {
    return { valid: false, normalized, reason: 'IMEI kontrol hanesi geçersiz' };
  }
  return { valid: true, normalized };
}

/** EAN-13 barkod checksum */
export function validateEan13(raw: string): {
  valid: boolean;
  normalized: string;
  reason?: string;
} {
  const normalized = raw.replace(/\s+/g, '');
  if (!/^\d{13}$/.test(normalized)) {
    return { valid: false, normalized, reason: 'EAN-13 13 haneli olmalıdır' };
  }
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const n = Number(normalized[i]);
    sum += i % 2 === 0 ? n : n * 3;
  }
  const expected = (10 - (sum % 10)) % 10;
  if (expected !== Number(normalized[12])) {
    return { valid: false, normalized, reason: 'EAN-13 kontrol hanesi geçersiz' };
  }
  return { valid: true, normalized };
}

