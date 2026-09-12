/**
 * Form Analyzer — Phase 4 C.2
 *
 * Web formlarındaki kişisel veri (PII) alanlarını tespit eder, üçüncü taraf
 * form action URL'lerini işaretler ve her form için açık rıza (consent)
 * gerekip gerekmediğini hesaplar.
 *
 * Mimari:
 *   - PII_FIELDS: regex pattern listesi (alan adı + type eşleşmesi)
 *   - classifyFormFields(fields[]) → sensitive flag eklenmiş FormField[]
 *   - analyzeForms(forms[]) → FormRecord[] (consent + third-party detect)
 *
 * Pattern reuse:
 *   - src/modules/compliance/scanner.ts (isSensitiveField helper pattern)
 *   - src/modules/compliance/schemas.ts (FormField, FormRecord types)
 */

import type { FormField, FormRecord } from './schemas';

// ============================================================================
// PII_FIELDS
// ============================================================================

/**
 * Tek bir PII pattern tanımı — alan adı (name) veya input type eşleşmesi.
 *
 * - pattern: regex (case-insensitive karşılaştırma name+type üzerinde)
 * - category: KVKK Madde 6 özel nitelikli veri kategorisi (true) veya
 *   genel kişisel veri (false)
 * - sensitivity: 'general' | 'sensitive' (KVKK Madde 6 ayrımı)
 * - gdprBasis: GDPR yasal dayanağı ("consent" | "contract" | "legal_obligation")
 */
export interface PIIFieldPattern {
  pattern: RegExp;
  /** Regex'in neyi aradığı (debug/log için). */
  label: string;
  category: 'identity' | 'contact' | 'financial' | 'health' | 'biometric' | 'special';
  /** KVKK Madde 6: özel nitelikli kişisel veri mi? */
  sensitivity: 'general' | 'sensitive';
  gdprBasis: 'consent' | 'contract' | 'legal_obligation';
}

/**
 * PII regex pattern'leri — name ve type attribute üzerinde match.
 * `name + " " + type` birleştirilip aranır (type="email" → "email" geçer).
 */
export const PII_FIELDS: readonly PIIFieldPattern[] = [
  // ---- Identity (TCKN, kimlik, pasaport) --------------------------------
  {
    pattern: /\b(tc|kimlik|tc_kimlik|tckimlik|identity)\b/i,
    label: 'TC Kimlik / Identity',
    category: 'identity',
    sensitivity: 'sensitive',
    gdprBasis: 'legal_obligation',
  },
  {
    pattern: /\b(passport|pasaport)\b/i,
    label: 'Pasaport',
    category: 'identity',
    sensitivity: 'sensitive',
    gdprBasis: 'legal_obligation',
  },
  {
    pattern: /\b(driver|ehliyet|license)\b/i,
    label: 'Ehliyet',
    category: 'identity',
    sensitivity: 'general',
    gdprBasis: 'contract',
  },
  {
    pattern: /\b(ssn|social_security)\b/i,
    label: 'SSN (US)',
    category: 'identity',
    sensitivity: 'sensitive',
    gdprBasis: 'legal_obligation',
  },

  // ---- Contact (email, phone, address) ---------------------------------
  {
    pattern: /\bemail\b|^type=email$/i,
    label: 'E-posta',
    category: 'contact',
    sensitivity: 'general',
    gdprBasis: 'consent',
  },
  {
    pattern: /\b(phone|tel|gsm|mobile|cep)\b/i,
    label: 'Telefon',
    category: 'contact',
    sensitivity: 'general',
    gdprBasis: 'consent',
  },
  {
    pattern: /\b(address|adres)\b/i,
    label: 'Adres',
    category: 'contact',
    sensitivity: 'general',
    gdprBasis: 'contract',
  },

  // ---- Financial (credit card, IBAN) ------------------------------------
  {
    pattern: /\b(card|kart|kredi|credit|card_number|cc_number)\b/i,
    label: 'Kredi kartı',
    category: 'financial',
    sensitivity: 'sensitive',
    gdprBasis: 'contract',
  },
  {
    pattern: /\b(iban|account_number|hesap)\b/i,
    label: 'IBAN / Hesap',
    category: 'financial',
    sensitivity: 'sensitive',
    gdprBasis: 'contract',
  },
  {
    pattern: /\bcvv\b/i,
    label: 'CVV',
    category: 'financial',
    sensitivity: 'sensitive',
    gdprBasis: 'contract',
  },

  // ---- Health (KVKK Madde 6 — özel nitelikli) --------------------------
  {
    pattern: /\b(sağlık|health|medical|tıbbi|hastalık|disease|allergy)\b/i,
    label: 'Sağlık verisi',
    category: 'health',
    sensitivity: 'sensitive',
    gdprBasis: 'consent',
  },

  // ---- Biometric -------------------------------------------------------
  {
    pattern: /\b(biometric|biyometri|fingerprint|yüz|face|retina)\b/i,
    label: 'Biyometrik veri',
    category: 'biometric',
    sensitivity: 'sensitive',
    gdprBasis: 'consent',
  },

  // ---- Special categories (KVKK Madde 6) ------------------------------
  {
    pattern: /\b(din|religion|ırk|race|etnik)\b/i,
    label: 'Din/Irk (özel)',
    category: 'special',
    sensitivity: 'sensitive',
    gdprBasis: 'consent',
  },
  {
    pattern: /\b(cinsel|sexual|orientation)\b/i,
    label: 'Cinsel yönelim (özel)',
    category: 'special',
    sensitivity: 'sensitive',
    gdprBasis: 'consent',
  },
  {
    pattern: /\b(siyasi|political|görüş|opinion)\b/i,
    label: 'Siyasi görüş (özel)',
    category: 'special',
    sensitivity: 'sensitive',
    gdprBasis: 'consent',
  },
  {
    pattern: /\b(sendika|union|membership)\b/i,
    label: 'Sendika üyeliği (özel)',
    category: 'special',
    sensitivity: 'sensitive',
    gdprBasis: 'consent',
  },

  // ---- Date of birth ---------------------------------------------------
  {
    pattern: /\b(dob|birth|birthday|doğum|tarih)\b/i,
    label: 'Doğum tarihi',
    category: 'identity',
    sensitivity: 'general',
    gdprBasis: 'consent',
  },

  // ---- Full name -------------------------------------------------------
  {
    pattern: /\b(name|isim|ad|ad_soyad|fullname|firstname|lastname)\b/i,
    label: 'İsim / Ad',
    category: 'identity',
    sensitivity: 'general',
    gdprBasis: 'contract',
  },
] as const;

// ============================================================================
// Third-party hosts
// ============================================================================

/**
 * Üçüncü taraf form action host'ları — bilinen form backend servisleri.
 * Form action URL'i bu host'lardan birine gidiyorsa third-party flag'i true.
 */
const THIRD_PARTY_FORM_HOSTS: readonly string[] = [
  'formspree.io',
  'formspree.com',
  'typeform.com',
  'jotform.com',
  'google.com/forms',
  'docs.google.com',
  'hubspot.com',
  'salesforce.com',
  'mailchimp.com',
  'sendinblue.com',
  'brevo.com',
  'wufoo.com',
  'gravityforms.com',
  'webhook.site',
  'zoho.com',
  'tally.so',
  'fillout.com',
];

// ============================================================================
// Public API
// ============================================================================

/**
 * Form alanlarını sınıflandırır — sensitive flag ekler.
 * Input: ham field listesi (scanner'dan gelen).
 * Output: FormField[] (sensitive boolean eklenmiş).
 */
export function classifyFormFields(
  fields: ReadonlyArray<{ name: string; type: string; required: boolean }>
): FormField[] {
  return fields.map((f) => {
    const hit = matchPII(f.name, f.type);
    return {
      name: f.name,
      type: f.type,
      required: f.required,
      sensitive: hit ? hit.sensitivity === 'sensitive' : false,
    };
  });
}

/**
 * Form'ları analiz eder — her form için:
 *   - PII alanlarını işaretler (sensitive)
 *   - consent checkbox var mı kontrol eder (form içinde onay mekanizması)
 *   - action URL'i üçüncü taraf host'a mı bakıyor
 *   - consentRequired flag: form PII topluyorsa ve consent checkbox yoksa true
 */
export function analyzeForms(
  forms: ReadonlyArray<{
    url: string;
    action?: string;
    method: string;
    fields: ReadonlyArray<{ name: string; type: string; required: boolean }>;
  }>
): FormRecord[] {
  return forms.map((f) => {
    const classifiedFields = classifyFormFields(f.fields);
    const hasConsentField = f.fields.some((x) => isConsentField(x.name, x.type));
    const hasPII = classifiedFields.some((x) => x.sensitive);
    const isThirdParty = isThirdPartyAction(f.action);

    return {
      url: f.url,
      action: f.action && f.action.length > 0 ? f.action : undefined,
      method: f.method === 'POST' ? 'POST' : 'GET',
      fields: classifiedFields,
      consentRequired: !hasConsentField && (hasPII || classifiedFields.length > 0),
    };
  });
}

// ============================================================================
// Helpers
// ============================================================================

function matchPII(name: string, type: string): PIIFieldPattern | null {
  const haystack = `${name} ${type}`.toLowerCase();
  for (const p of PII_FIELDS) {
    if (p.pattern.test(haystack) || p.pattern.test(name.toLowerCase())) {
      return p;
    }
  }
  return null;
}

function isConsentField(name: string, type: string): boolean {
  const lower = `${name} ${type}`.toLowerCase();
  return (
    type === 'checkbox' &&
    (lower.includes('consent') ||
      lower.includes('onay') ||
      lower.includes('kvkk') ||
      lower.includes('gdpr') ||
      lower.includes('agree') ||
      lower.includes('kabul'))
  );
}

function isThirdPartyAction(action?: string): boolean {
  if (!action || action.length === 0) return false;
  const lower = action.toLowerCase();
  // mailto: veya relative path → same-origin kabul
  if (lower.startsWith('mailto:') || lower.startsWith('/') || lower.startsWith('#')) {
    return false;
  }
  try {
    const url = new URL(action);
    const host = url.hostname.toLowerCase();
    return THIRD_PARTY_FORM_HOSTS.some((known) => host === known || host.endsWith(`.${known}`));
  } catch {
    return false;
  }
}
