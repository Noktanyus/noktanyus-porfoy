import { describe, it, expect } from 'vitest';
import { locales, defaultLocale, localeLabels, localeFlags, isLocale } from '../config';

describe('i18n config', () => {
  it('contains tr and en locales', () => {
    expect(locales).toContain('tr');
    expect(locales).toContain('en');
  });

  it('default locale is tr', () => {
    expect(defaultLocale).toBe('tr');
  });

  it('every locale has a human label', () => {
    for (const loc of locales) {
      expect(localeLabels[loc]).toBeTruthy();
      expect(typeof localeLabels[loc]).toBe('string');
    }
  });

  it('every locale has a flag emoji', () => {
    for (const loc of locales) {
      expect(localeFlags[loc]).toBeTruthy();
    }
  });

  it('isLocale correctly validates known locales', () => {
    expect(isLocale('tr')).toBe(true);
    expect(isLocale('en')).toBe(true);
    expect(isLocale('fr')).toBe(false);
    expect(isLocale(undefined)).toBe(false);
    expect(isLocale(null)).toBe(false);
    expect(isLocale('')).toBe(false);
  });

  it('locales is readonly tuple', () => {
    // Type-level guard; runtime'da sadece uzunluk kontrolü
    expect(locales.length).toBe(2);
  });
});
