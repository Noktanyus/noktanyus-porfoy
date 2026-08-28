/**
 * Theme Helpers — Unit Tests
 *
 * Test edilenler:
 *   - ACCENT_COLORS / THEME_OPTIONS shape
 *   - getAccentHex returns hex for valid, fallback for invalid
 *   - getAccentColorClasses returns correct Tailwind classes
 *   - isAccentColor / isThemeOption type guards
 *   - applyAccentToDocument writes CSS vars + dataset
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  ACCENT_COLORS,
  THEME_OPTIONS,
  getAccentHex,
  getAccentColorClasses,
  isAccentColor,
  isThemeOption,
  applyAccentToDocument,
  readAccentFromDocument,
} from '../theme';

describe('theme constants', () => {
  it('THEME_OPTIONS has light, dark, system', () => {
    const values = THEME_OPTIONS.map((o) => o.value);
    expect(values).toContain('light');
    expect(values).toContain('dark');
    expect(values).toContain('system');
    expect(values).toHaveLength(3);
  });

  it('ACCENT_COLORS contains the 5 required accents', () => {
    const values = ACCENT_COLORS.map((c) => c.value);
    expect(values).toEqual(['blue', 'purple', 'green', 'orange', 'pink']);
    values.forEach((v) => {
      const entry = ACCENT_COLORS.find((c) => c.value === v);
      expect(entry?.hex).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });
});

describe('getAccentHex', () => {
  it('returns the correct hex for a valid accent', () => {
    expect(getAccentHex('blue')).toBe('#3b82f6');
    expect(getAccentHex('purple')).toBe('#a855f7');
    expect(getAccentHex('green')).toBe('#22c55e');
    expect(getAccentHex('orange')).toBe('#f97316');
    expect(getAccentHex('pink')).toBe('#ec4899');
  });

  it('falls back to blue for invalid accent', () => {
    // @ts-expect-error testing invalid input
    expect(getAccentHex('neon')).toBe('#3b82f6');
  });
});

describe('getAccentColorClasses', () => {
  it('returns text + bg + hover + ring for each accent', () => {
    const accents: Array<'blue' | 'purple' | 'green' | 'orange' | 'pink'> = [
      'blue',
      'purple',
      'green',
      'orange',
      'pink',
    ];
    for (const a of accents) {
      const cls = getAccentColorClasses(a);
      expect(cls.text).toContain(`text-${a}`);
      expect(cls.bg).toContain(`bg-${a}`);
      expect(cls.hover).toContain(`hover:bg-${a}`);
      expect(cls.ring).toContain(`ring-${a}`);
    }
  });
});

describe('isAccentColor / isThemeOption', () => {
  it('isAccentColor narrows correctly', () => {
    expect(isAccentColor('blue')).toBe(true);
    expect(isAccentColor('purple')).toBe(true);
    expect(isAccentColor('cyan')).toBe(false);
    expect(isAccentColor(123)).toBe(false);
    expect(isAccentColor(null)).toBe(false);
    expect(isAccentColor(undefined)).toBe(false);
  });

  it('isThemeOption narrows correctly', () => {
    expect(isThemeOption('light')).toBe(true);
    expect(isThemeOption('dark')).toBe(true);
    expect(isThemeOption('system')).toBe(true);
    expect(isThemeOption('auto')).toBe(false);
    expect(isThemeOption('')).toBe(false);
  });
});

describe('applyAccentToDocument', () => {
  let originalSetProperty: typeof document.documentElement.style.setProperty;
  let setPropertySpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    setPropertySpy = vi.fn();
    originalSetProperty = document.documentElement.style.setProperty;
    document.documentElement.style.setProperty = setPropertySpy;
  });

  afterEach(() => {
    document.documentElement.style.setProperty = originalSetProperty;
  });

  it('writes --accent and --accent-ring CSS vars', () => {
    applyAccentToDocument('purple');
    expect(setPropertySpy).toHaveBeenCalledWith('--accent', '#a855f7');
    expect(setPropertySpy).toHaveBeenCalledWith('--accent-ring', '#a855f7');
    expect(document.documentElement.dataset.accent).toBe('purple');
  });

  it('does not throw when called server-side (no document)', () => {
    const originalDoc = global.document;
    // @ts-expect-error forcing no-document environment
    delete global.document;
    try {
      expect(() => applyAccentToDocument('orange')).not.toThrow();
    } finally {
      global.document = originalDoc;
    }
  });
});

describe('readAccentFromDocument', () => {
  it('returns dataset accent when set', () => {
    document.documentElement.dataset.accent = 'green';
    expect(readAccentFromDocument()).toBe('green');
  });

  it('returns blue default when dataset accent missing', () => {
    delete document.documentElement.dataset.accent;
    expect(readAccentFromDocument()).toBe('blue');
  });

  it('returns blue when dataset accent is invalid', () => {
    document.documentElement.dataset.accent = 'invalid';
    expect(readAccentFromDocument()).toBe('blue');
  });
});