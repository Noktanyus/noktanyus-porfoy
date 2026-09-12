'use client';

/**
 * @file BrandingProvider — workspace brand + white-label theme CSS uygulayicisi.
 * @description
 *   Branding bilgisi (brandColor, brandLogo, customDomain) + opsiyonel
 *   white-label theme preset (themeKey, themeOverrides) prop olarak alinir.
 *   generateThemeCSS + brandingService.generateBrandCSS ile uretilen CSS
 *   document root'a <style> etiketi olarak enjekte edilir. Workspace degisimi
 *   effect dependency'si ile tetiklenir; SSR-safe no-op render sunar.
 *
 *   Iki ayri <style> etiketi kullanir:
 *     1. data-branding-root    → --brand-primary + --brand-logo (legacy)
 *     2. data-theme-root       → --brand-primary, --brand-accent, --brand-bg,
 *                                --brand-text (white-label preset)
 *
 *   Boylece var olan brandingService API ile yeni tema sistemi birlikte
 *   yasar; biri digerini ezmez.
 */

import { useEffect, useMemo } from 'react';
import { brandingService } from '@/modules/workspaces/brandingService';
import type { WorkspaceBranding } from '@/modules/workspaces/brandingService';
import {
  generateThemeCSS,
  ThemePresetConfig,
  isThemePresetKey,
  getThemePreset,
} from '@/lib/theme';

interface BrandingProviderProps {
  branding?: WorkspaceBranding | null;
  /** White-label tema preset anahtari (THEME_PRESETS). */
  themeKey?: string | null;
  /** Preset uzerinde override (hex). */
  themeOverrides?: Partial<ThemePresetConfig>;
  children: React.ReactNode;
}

export function BrandingProvider({
  branding,
  themeKey,
  themeOverrides,
  children,
}: BrandingProviderProps) {
  // Legacy brand CSS (--brand-primary, --brand-logo)
  const brandCss = useMemo(() => {
    if (!branding) return null;
    return brandingService.generateBrandCSS(branding);
  }, [branding]);

  // White-label tema CSS (--brand-primary/accent/bg/text)
  const themeCss = useMemo(() => {
    if (!themeKey) return null;
    return generateThemeCSS(themeKey, themeOverrides);
  }, [themeKey, themeOverrides]);

  // Inline CSS variable'lar — FOUC (flash of unstyled content) onleme.
  // Bilesen mount olmadan document uzerinde set edilmesi gerekmedigi icin
  // sadece <style> injection ile yetiniyoruz; SSR tarafinda Next.js'in
  // kritik CSS'i head'e inline olarak eklemesini bekliyoruz.
  const inlineVars = useMemo(() => {
    if (!themeKey) return null;
    const key = isThemePresetKey(themeKey) ? themeKey : 'modern';
    const base = getThemePreset(key);
    const merged: ThemePresetConfig = {
      primary: themeOverrides?.primary ?? base.primary,
      accent: themeOverrides?.accent ?? base.accent,
      bg: themeOverrides?.bg ?? base.bg,
      text: themeOverrides?.text ?? base.text,
    };
    return merged;
  }, [themeKey, themeOverrides]);

  // Legacy branding injection
  useEffect(() => {
    if (!brandCss) return;
    const styleEl = document.createElement('style');
    styleEl.dataset.brandingRoot = 'true';
    styleEl.textContent = brandCss;
    document.documentElement.appendChild(styleEl);
    return () => {
      if (styleEl.parentNode) styleEl.parentNode.removeChild(styleEl);
    };
  }, [brandCss]);

  // White-label theme injection
  useEffect(() => {
    if (!themeCss) return;
    const styleEl = document.createElement('style');
    styleEl.dataset.themeRoot = 'true';
    styleEl.textContent = themeCss;
    document.documentElement.appendChild(styleEl);
    return () => {
      if (styleEl.parentNode) styleEl.parentNode.removeChild(styleEl);
    };
  }, [themeCss]);

  // Inline CSS variable fallback — eger <style> henuz enjekte edilmediyse
  // mount aninda --brand-* var'larini dogrudan root.style uzerinden set et.
  useEffect(() => {
    if (typeof document === 'undefined' || !inlineVars) return;
    const root = document.documentElement;
    const prev = {
      primary: root.style.getPropertyValue('--brand-primary'),
      accent: root.style.getPropertyValue('--brand-accent'),
      bg: root.style.getPropertyValue('--brand-bg'),
      text: root.style.getPropertyValue('--brand-text'),
    };
    root.style.setProperty('--brand-primary', inlineVars.primary);
    root.style.setProperty('--brand-accent', inlineVars.accent);
    root.style.setProperty('--brand-bg', inlineVars.bg);
    root.style.setProperty('--brand-text', inlineVars.text);
    root.dataset.themePreset = isThemePresetKey(themeKey) ? themeKey : 'modern';
    return () => {
      // Cleanup: onceki degerlere geri don; bos string ise temizle.
      root.style.setProperty('--brand-primary', prev.primary);
      root.style.setProperty('--brand-accent', prev.accent);
      root.style.setProperty('--brand-bg', prev.bg);
      root.style.setProperty('--brand-text', prev.text);
    };
  }, [inlineVars, themeKey]);

  return <>{children}</>;
}

export default BrandingProvider;
