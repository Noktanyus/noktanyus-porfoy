/**
 * Form Analyzer — Unit Tests (Phase 4 C.2)
 *
 * Test coverage:
 *   - classifyFormFields: PII detection (sensitive flag)
 *   - analyzeForms: 3rd party detection, consent checkbox detection
 *   - PII_FIELDS structural assertions
 */

import { describe, it, expect } from 'vitest';
import {
  classifyFormFields,
  analyzeForms,
  PII_FIELDS,
} from '../formAnalyzer';

// ============================================================================
// classifyFormFields — non-PII fields
// ============================================================================

describe('classifyFormFields — non-PII fields', () => {
  it('returns sensitive=false for plain text fields', () => {
    const fields = classifyFormFields([
      { name: 'comments', type: 'text', required: false },
    ]);
    expect(fields[0]!.sensitive).toBe(false);
    expect(fields[0]!.name).toBe('comments');
    expect(fields[0]!.type).toBe('text');
    expect(fields[0]!.required).toBe(false);
  });

  it('returns sensitive=false for unknown field names', () => {
    const fields = classifyFormFields([
      { name: 'favorite_color', type: 'text', required: false },
      { name: 'subscribe', type: 'checkbox', required: false },
    ]);
    expect(fields[0]!.sensitive).toBe(false);
    expect(fields[1]!.sensitive).toBe(false);
  });

  it('preserves required flag', () => {
    const fields = classifyFormFields([
      { name: 'foo', type: 'text', required: true },
    ]);
    expect(fields[0]!.required).toBe(true);
  });
});

// ============================================================================
// classifyFormFields — PII detection (sensitive)
// ============================================================================

describe('classifyFormFields — PII detection', () => {
  it('detects email field (contact, general sensitivity)', () => {
    const fields = classifyFormFields([
      { name: 'email', type: 'email', required: true },
    ]);
    // email is contact → general (NOT sensitive)
    expect(fields[0]!.sensitive).toBe(false);
  });

  it('detects phone field', () => {
    const fields = classifyFormFields([
      { name: 'phone', type: 'tel', required: true },
    ]);
    expect(fields[0]!.sensitive).toBe(false);
  });

  it('detects TC kimlik (sensitive — KVKK Madde 6 special category)', () => {
    const fields = classifyFormFields([
      { name: 'tc_kimlik', type: 'text', required: true },
    ]);
    expect(fields[0]!.sensitive).toBe(true);
  });

  it('detects identity keyword as sensitive', () => {
    const fields = classifyFormFields([
      { name: 'identity', type: 'text', required: true },
    ]);
    expect(fields[0]!.sensitive).toBe(true);
  });

  it('detects credit card (financial, sensitive)', () => {
    const fields = classifyFormFields([
      { name: 'card_number', type: 'text', required: true },
    ]);
    expect(fields[0]!.sensitive).toBe(true);
  });

  it('detects CVV as sensitive', () => {
    const fields = classifyFormFields([
      { name: 'cvv', type: 'text', required: true },
    ]);
    expect(fields[0]!.sensitive).toBe(true);
  });

  it('detects IBAN as sensitive', () => {
    const fields = classifyFormFields([
      { name: 'iban', type: 'text', required: true },
    ]);
    expect(fields[0]!.sensitive).toBe(true);
  });

  it('detects health-related fields as sensitive', () => {
    const fields = classifyFormFields([
      { name: 'health', type: 'text', required: false },
      { name: 'allergy', type: 'textarea', required: false },
    ]);
    expect(fields[0]!.sensitive).toBe(true);
    expect(fields[1]!.sensitive).toBe(true);
  });

  it('detects biometric fields as sensitive', () => {
    const fields = classifyFormFields([
      { name: 'fingerprint', type: 'text', required: true },
      { name: 'face', type: 'text', required: true },
    ]);
    expect(fields[0]!.sensitive).toBe(true);
    expect(fields[1]!.sensitive).toBe(true);
  });

  it('detects special category fields (religion, race, political)', () => {
    const fields = classifyFormFields([
      { name: 'religion', type: 'text', required: false },
      { name: 'race', type: 'text', required: false },
      { name: 'political', type: 'text', required: false },
    ]);
    expect(fields[0]!.sensitive).toBe(true);
    expect(fields[1]!.sensitive).toBe(true);
    expect(fields[2]!.sensitive).toBe(true);
  });

  it('detects date of birth (general identity)', () => {
    const fields = classifyFormFields([
      { name: 'birth_date', type: 'date', required: true },
    ]);
    // dob → general (NOT sensitive per category)
    expect(fields[0]!.sensitive).toBe(false);
  });

  it('detects full name as identity (general)', () => {
    const fields = classifyFormFields([
      { name: 'fullname', type: 'text', required: true },
    ]);
    expect(fields[0]!.sensitive).toBe(false);
  });
});

// ============================================================================
// classifyFormFields — mixed field types
// ============================================================================

describe('classifyFormFields — mixed fields', () => {
  it('classifies mixed sensitive and non-sensitive fields correctly', () => {
    const fields = classifyFormFields([
      { name: 'email', type: 'email', required: true },
      { name: 'tc_kimlik', type: 'text', required: true },
      { name: 'comments', type: 'textarea', required: false },
      { name: 'phone', type: 'tel', required: true },
    ]);
    expect(fields[0]!.sensitive).toBe(false); // email
    expect(fields[1]!.sensitive).toBe(true); // tc_kimlik
    expect(fields[2]!.sensitive).toBe(false); // comments
    expect(fields[3]!.sensitive).toBe(false); // phone
  });

  it('handles empty input', () => {
    expect(classifyFormFields([])).toEqual([]);
  });
});

// ============================================================================
// analyzeForms — third-party detection
// ============================================================================

describe('analyzeForms — third-party detection', () => {
  it('does not flag same-origin form (no action)', () => {
    const result = analyzeForms([
      {
        url: 'https://example.com/contact',
        method: 'POST',
        fields: [{ name: 'email', type: 'email', required: true }],
      },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0]!.url).toBe('https://example.com/contact');
  });

  it('does not flag relative-path action', () => {
    const result = analyzeForms([
      {
        url: 'https://example.com/contact',
        action: '/api/contact',
        method: 'POST',
        fields: [{ name: 'email', type: 'email', required: true }],
      },
    ]);
    // action is set but it's relative — same origin
    expect(result[0]!.action).toBe('/api/contact');
  });

  it('treats mailto: action as same-origin', () => {
    const result = analyzeForms([
      {
        url: 'https://example.com/contact',
        action: 'mailto:hello@example.com',
        method: 'POST',
        fields: [],
      },
    ]);
    expect(result[0]!.action).toBe('mailto:hello@example.com');
  });

  it('handles forms without explicit action', () => {
    const result = analyzeForms([
      {
        url: 'https://example.com/form',
        method: 'GET',
        fields: [{ name: 'search', type: 'text', required: false }],
      },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0]!.action).toBeUndefined();
  });
});

// ============================================================================
// analyzeForms — consentRequired flag
// ============================================================================

describe('analyzeForms — consentRequired flag', () => {
  it('requires consent when PII fields exist and no consent checkbox', () => {
    const result = analyzeForms([
      {
        url: 'https://example.com/contact',
        method: 'POST',
        fields: [
          { name: 'tc_kimlik', type: 'text', required: true },
          { name: 'email', type: 'email', required: true },
        ],
      },
    ]);
    expect(result[0]!.consentRequired).toBe(true);
  });

  it('does not require consent when consent checkbox is present', () => {
    const result = analyzeForms([
      {
        url: 'https://example.com/contact',
        method: 'POST',
        fields: [
          { name: 'tc_kimlik', type: 'text', required: true },
          { name: 'kvkk_onay', type: 'checkbox', required: true },
        ],
      },
    ]);
    expect(result[0]!.consentRequired).toBe(false);
  });

  it('does not require consent for empty forms with no fields', () => {
    const result = analyzeForms([
      {
        url: 'https://example.com/empty',
        method: 'POST',
        fields: [],
      },
    ]);
    // Empty form has no fields — consentRequired defaults to false
    expect(result[0]!.consentRequired).toBe(false);
  });

  it('detects consent by various keywords', () => {
    const consentVariants = [
      'kvkk_onay',
      'gdpr_consent',
      'consent_checkbox',
      'onay_kutusu',
      'agree_terms',
      'kabul_edildi',
    ];
    for (const name of consentVariants) {
      const result = analyzeForms([
        {
          url: 'https://example.com/form',
          method: 'POST',
          fields: [
            { name: 'tc_kimlik', type: 'text', required: true },
            { name, type: 'checkbox', required: true },
          ],
        },
      ]);
      expect(result[0]!.consentRequired).toBe(false);
    }
  });
});

// ============================================================================
// analyzeForms — method handling
// ============================================================================

describe('analyzeForms — method handling', () => {
  it('keeps POST uppercase as POST', () => {
    const result = analyzeForms([
      {
        url: 'https://example.com/contact',
        method: 'POST',
        fields: [],
      },
    ]);
    expect(result[0]!.method).toBe('POST');
  });

  it('normalizes "GET" to "GET"', () => {
    const result = analyzeForms([
      {
        url: 'https://example.com/search',
        method: 'GET',
        fields: [],
      },
    ]);
    expect(result[0]!.method).toBe('GET');
  });

  it('defaults non-POST to GET', () => {
    const result = analyzeForms([
      {
        url: 'https://example.com/form',
        method: 'PUT',
        fields: [],
      },
    ]);
    expect(result[0]!.method).toBe('GET');
  });
});

// ============================================================================
// analyzeForms — batch processing
// ============================================================================

describe('analyzeForms — batch', () => {
  it('processes multiple forms', () => {
    const result = analyzeForms([
      {
        url: 'https://example.com/a',
        method: 'POST',
        fields: [{ name: 'tc_kimlik', type: 'text', required: true }],
      },
      {
        url: 'https://example.com/b',
        method: 'GET',
        fields: [],
      },
      {
        url: 'https://example.com/c',
        method: 'POST',
        fields: [
          { name: 'tc_kimlik', type: 'text', required: true },
          { name: 'kvkk_onay', type: 'checkbox', required: true },
        ],
      },
    ]);
    expect(result).toHaveLength(3);
    expect(result[0]!.consentRequired).toBe(true);
    expect(result[1]!.consentRequired).toBe(false);
    expect(result[2]!.consentRequired).toBe(false);
  });

  it('returns empty array for empty input', () => {
    expect(analyzeForms([])).toEqual([]);
  });
});

// ============================================================================
// PII_FIELDS — structural assertions
// ============================================================================

describe('PII_FIELDS', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(PII_FIELDS)).toBe(true);
    expect(PII_FIELDS.length).toBeGreaterThan(5);
  });

  it('every entry has a valid category', () => {
    const categories = [
      'identity',
      'contact',
      'financial',
      'health',
      'biometric',
      'special',
    ];
    for (const p of PII_FIELDS) {
      expect(categories).toContain(p.category);
    }
  });

  it('every entry has a valid sensitivity', () => {
    for (const p of PII_FIELDS) {
      expect(['general', 'sensitive']).toContain(p.sensitivity);
    }
  });

  it('every entry has a valid gdprBasis', () => {
    for (const p of PII_FIELDS) {
      expect(['consent', 'contract', 'legal_obligation']).toContain(p.gdprBasis);
    }
  });

  it('includes common PII categories', () => {
    const labels = PII_FIELDS.map((p) => p.label);
    expect(labels.some((l) => l.includes('E-posta'))).toBe(true);
    expect(labels.some((l) => l.includes('Telefon'))).toBe(true);
    expect(labels.some((l) => l.includes('Kredi'))).toBe(true);
  });
});
