import { describe, it, expect } from 'vitest';
import trMessages from '../messages/tr.json';
import enMessages from '../messages/en.json';

/**
 * İki dil dosyası arasındaki anahtar eşitliğini kontrol eder.
 * - Eksik TR anahtarı → EN'de karşılığı yok → test FAIL
 * - Fazlalık TR anahtarı → EN'de karşılığı yok → test FAIL
 */
function collectKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  const out: string[] = [];
  for (const k of Object.keys(obj)) {
    const value = obj[k];
    const path = prefix ? `${prefix}.${k}` : k;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      out.push(...collectKeys(value as Record<string, unknown>, path));
    } else {
      out.push(path);
    }
  }
  return out;
}

describe('i18n message files', () => {
  it('tr.json parses as valid JSON object', () => {
    expect(typeof trMessages).toBe('object');
    expect(trMessages).not.toBeNull();
  });

  it('en.json parses as valid JSON object', () => {
    expect(typeof enMessages).toBe('object');
    expect(enMessages).not.toBeNull();
  });

  it('tr and en share the same key structure', () => {
    const trKeys = new Set(collectKeys(trMessages as Record<string, unknown>));
    const enKeys = new Set(collectKeys(enMessages as Record<string, unknown>));

    const missingInEn: string[] = [];
    for (const k of trKeys) {
      if (!enKeys.has(k)) missingInEn.push(k);
    }

    const extraInEn: string[] = [];
    for (const k of enKeys) {
      if (!trKeys.has(k)) extraInEn.push(k);
    }

    expect(
      missingInEn,
      `Keys present in tr.json but missing in en.json: ${missingInEn.join(', ')}`
    ).toEqual([]);
    expect(
      extraInEn,
      `Keys present in en.json but missing in tr.json: ${extraInEn.join(', ')}`
    ).toEqual([]);
  });

  it('required namespaces exist', () => {
    const requiredNamespaces = [
      'common',
      'nav',
      'home',
      'about',
      'blog',
      'projects',
      'contact',
      'store',
      'pricing',
      'footer',
      'locale',
    ];
    for (const ns of requiredNamespaces) {
      expect((trMessages as Record<string, unknown>)[ns], `tr.${ns} missing`).toBeDefined();
      expect((enMessages as Record<string, unknown>)[ns], `en.${ns} missing`).toBeDefined();
    }
  });
});
