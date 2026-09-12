/**
 * Theme Presets — Unit Tests
 *
 * White-label theme preset sistemi:
 *  - THEME_PRESETS keys (modern, minimalist, vibrant, corporate, dark) icin
 *    primary/accent/bg/text alanlarinin tamami gecerli hex renk.
 *  - isThemePresetKey tip korumasi.
 *  - getThemePreset bilinmeyen key icin "modern" fallback doner.
 *  - generateThemeCSS hem default preset hem override ile valid CSS uretir.
 *  - Gecersiz hex override degerleri preset degerini korur (XSS hardening).
 */

import { describe, it, expect } from 'vitest';
import {
  THEME_PRESETS,
  THEME_PRESET_KEYS,
  isThemePresetKey,
  getThemePreset,
  generateThemeCSS,
  type ThemePresetKey,
} from '@/lib/theme';

describe('THEME_PRESETS', () => {
  const hexRegex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

  it('exposes the 5 documented preset keys', () => {
    expect(THEME_PRESET_KEYS).toEqual([
      'modern',
      'minimalist',
      'vibrant',
      'corporate',
      'dark',
    ]);
    expect(Object.keys(THEME_PRESETS).sort()).toEqual([...THEME_PRESET_KEYS].sort());
  });

  it.each(THEME_PRESET_KEYS)(
    '%s has valid hex values for primary, accent, bg, text',
    (key) => {
      const preset = THEME_PRESETS[key as ThemePresetKey];
      expect(preset.primary).toMatch(hexRegex);
      expect(preset.accent).toMatch(hexRegex);
      expect(preset.bg).toMatch(hexRegex);
      expect(preset.text).toMatch(hexRegex);
    }
  );

  it('dark preset has dark bg (#0f172a) and light text', () => {
    expect(THEME_PRESETS.dark.bg).toBe('#0f172a');
    expect(THEME_PRESETS.dark.text).toBe('#f1f5f9');
  });

  it('light presets have light bg (#ffffff or near-white) and dark text', () => {
    for (const key of ['modern', 'minimalist', 'vibrant'] as const) {
      expect(THEME_PRESETS[key].bg).toMatch(/^#(fff|ffffff|f8fafc)$/i);
      expect(THEME_PRESETS[key].text).toMatch(/^#0f172a$/);
    }
  });
});

describe('isThemePresetKey', () => {
  it('returns true for valid preset keys', () => {
    expect(isThemePresetKey('modern')).toBe(true);
    expect(isThemePresetKey('dark')).toBe(true);
  });

  it('returns false for unknown / non-string values', () => {
    expect(isThemePresetKey('nope')).toBe(false);
    expect(isThemePresetKey(null)).toBe(false);
    expect(isThemePresetKey(undefined)).toBe(false);
    expect(isThemePresetKey(123)).toBe(false);
    expect(isThemePresetKey({})).toBe(false);
  });
});

describe('getThemePreset', () => {
  it('returns preset for valid key', () => {
    expect(getThemePreset('modern').primary).toBe(THEME_PRESETS.modern.primary);
    expect(getThemePreset('dark').bg).toBe(THEME_PRESETS.dark.bg);
  });

  it('falls back to "modern" for null / undefined / unknown key', () => {
    expect(getThemePreset(null)).toEqual(THEME_PRESETS.modern);
    expect(getThemePreset(undefined)).toEqual(THEME_PRESETS.modern);
    expect(getThemePreset('nope')).toEqual(THEME_PRESETS.modern);
  });
});

describe('generateThemeCSS', () => {
  it('produces a valid :root CSS block with preset values', () => {
    const css = generateThemeCSS('modern');

    expect(css).toContain(':root');
    expect(css).toContain('--brand-primary: #4f46e5');
    expect(css).toContain('--brand-accent: #06b6d4');
    expect(css).toContain('--brand-bg: #ffffff');
    expect(css).toContain('--brand-text: #0f172a');
    expect(css.trim().endsWith('}')).toBe(true);
  });

  it('applies valid hex overrides on top of preset', () => {
    const css = generateThemeCSS('dark', {
      primary: '#ff00aa',
      text: '#123456',
    });

    expect(css).toContain('--brand-primary: #ff00aa');
    expect(css).toContain('--brand-text: #123456');
    // preset degerleri korunmali
    expect(css).toContain('--brand-bg: #0f172a');
    expect(css).toContain('--brand-accent: #22d3ee');
  });

  it('ignores invalid hex overrides and keeps preset values (XSS hardening)', () => {
    const css = generateThemeCSS('modern', {
      primary: 'red; } body { display:none;',
      accent: 'not-a-color',
      bg: '<script>alert(1)</script>',
      text: '',
    });

    expect(css).toContain('--brand-primary: #4f46e5');
    expect(css).toContain('--brand-accent: #06b6d4');
    expect(css).toContain('--brand-bg: #ffffff');
    expect(css).toContain('--brand-text: #0f172a');
    expect(css).not.toContain('<script>');
    expect(css).not.toContain('display:none');
  });

  it('produces empty override passthrough for valid keys', () => {
    const css = generateThemeCSS('vibrant', {});
    expect(css).toContain('--brand-primary: #ec4899');
    expect(css).toContain('--brand-accent: #f59e0b');
  });
});
