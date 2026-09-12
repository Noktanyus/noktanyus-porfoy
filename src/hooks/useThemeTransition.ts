'use client';

/**
 * @file useThemeTransition — view transition destekli tema değiştirme hook'u.
 * @description next-themes'in useTheme'ini sarmalar ve tema değişimini
 *              View Transitions API içine sarar. Desteklemeyen tarayıcılarda
 *              setTheme'i anında çağırır (graceful fallback).
 *
 *              Phase 3 B.5 ile birlikte `useTheme(themeKey)` adinda yeni bir
 *              helper export edilir — BrandingProvider'a verilen white-label
 *              tema preset'ini document.documentElement uzerinde aktif eder.
 */

import { useTheme as useNextTheme } from 'next-themes';
import { useCallback, useEffect } from 'react';
import {
  ACCENT_COLORS,
  AccentColor,
  generateThemeCSS,
  getThemePreset,
  isThemePresetKey,
  ThemePresetConfig,
  ThemePresetKey,
} from '@/lib/theme';

interface UseThemeTransitionReturn {
  /** Şu anki aktif tema (system, light, dark olabilir). */
  theme: string | undefined;
  /** Çözümlenmiş tema (system ise systemTheme'a düşer). */
  resolvedTheme: string | undefined;
  setTheme: (theme: string) => void;
  /** Tema değiştirici — dark ise light, light ise dark yapar. */
  toggleTheme: () => void;
}

export function useThemeTransition(): UseThemeTransitionReturn {
  const { theme, setTheme, resolvedTheme } = useNextTheme();

  const toggleTheme = useCallback(() => {
    const isCurrentlyDark =
      resolvedTheme === 'dark' ||
      theme === 'dark' ||
      (typeof document !== 'undefined' && document.documentElement.classList.contains('dark'));
    const nextTheme = isCurrentlyDark ? 'light' : 'dark';

    setTheme(nextTheme);

    if (typeof document !== 'undefined') {
      const storedAccent = (document.documentElement.dataset.accent as AccentColor) || 'blue';
      const item = ACCENT_COLORS.find((c) => c.value === storedAccent);
      const oklch = nextTheme === 'dark' ? (item?.oklchDark ?? "0.7 0.15 255") : (item?.oklchLight ?? "0.55 0.18 255");
      document.documentElement.style.setProperty("--primary", oklch);
      document.documentElement.style.setProperty("--brand-primary", oklch);
      document.documentElement.style.setProperty("--ring", oklch);
    }
  }, [resolvedTheme, theme, setTheme]);

  return { theme, resolvedTheme, setTheme, toggleTheme };
}

// =================== useTheme (White-label preset) ===================

interface UseThemeArgs {
  /** THEME_PRESETS anahtari. Bilinmezse "modern" fallback. */
  themeKey?: string | null;
  /** Preset uzerinde override (hex). */
  overrides?: Partial<ThemePresetConfig>;
}

interface UseThemeReturn {
  /** Aktif preset config (override ile birlestirilmis). */
  config: ThemePresetConfig;
  /** Set edilmis tema anahtari. */
  themeKey: ThemePresetKey;
  /** Document uzerinde --brand-* CSS variable'larini aktif eder (effect tetikler). */
  apply: () => void;
}

/**
 * White-label tema preset'ini document.documentElement uzerinde aktif eder.
 * BrandingProvider ile birlikte kullanilir; SSR-safe — document yoksa no-op.
 *
 * Effect'i tetiklemek icin mount sonrasi apply() otomatik cagrilir.
 */
export function useTheme({ themeKey, overrides }: UseThemeArgs = {}): UseThemeReturn {
  const key: ThemePresetKey = isThemePresetKey(themeKey) ? themeKey : 'modern';
  const base = getThemePreset(key);
  const config: ThemePresetConfig = {
    primary: overrides?.primary ?? base.primary,
    accent: overrides?.accent ?? base.accent,
    bg: overrides?.bg ?? base.bg,
    text: overrides?.text ?? base.text,
  };

  const apply = useCallback(() => {
    if (typeof document === 'undefined') return;
    const css = generateThemeCSS(key, overrides);
    // Inline set — <style> injection BrandingProvider tarafindan yapiliyor.
    // Burada sadece kritik brand CSS var'larini dogrudan set ediyoruz ki
    // render flash'i olmasin.
    const root = document.documentElement;
    root.style.setProperty('--brand-primary', config.primary);
    root.style.setProperty('--brand-accent', config.accent);
    root.style.setProperty('--brand-bg', config.bg);
    root.style.setProperty('--brand-text', config.text);
    root.dataset.themePreset = key;
    // css referansi unused — BrandingProvider ayni config'i <style>'e yazar
    void css;
  }, [config, key, overrides]);

  useEffect(() => {
    apply();
  }, [apply]);

  return { config, themeKey: key, apply };
}
