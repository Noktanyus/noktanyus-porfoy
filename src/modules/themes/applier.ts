/**
 * @file Theme Applier
 * @description Runtime'da tema preset'lerini document'e inject eder.
 *              CSS variables'ı override ederek Tailwind oklch()
 *              sistemi ile tam uyumlu tema değişimi sağlar.
 *              SSR-safe: window/document yoksa no-op.
 */

import type { ThemePreset, ThemePresetId } from "./presets";
import { getPresetById, isThemePresetId } from "./presets";

/**
 * Verilen preset'i document'in <html> elementine uygular.
 * `data-theme-preset` attribute'unu set eder ki ileride
 * debug edilebilsin / CSS selector ile hedeflenebilsin.
 */
export function applyPresetToDocument(preset: ThemePreset): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;

  // Apply light tokens
  Object.entries(preset.tokens.light).forEach(([key, value]) => {
    root.style.setProperty(`--${key}`, value);
  });

  // Dark tokens override için inline style ile uygulanmaz,
  // .dark class'ı tarafından tetiklenen CSS rule'ları kullanır.
  // Ancak dark preset değerlerini data attribute olarak saklarız
  // ki dark mode aktifken oklch değerleri değiştirilebilsin.
  root.dataset.themePreset = preset.id;

  // Set inline :root.dark CSS rule'ları için data attribute
  // kullanarak CSS'te override yapılabilir.
  // Burada sadece dataset set ediyoruz; gerçek CSS rule'ları
  // global style tag'inde dinamik olarak eklenebilir (aşağıda).
  injectDarkPresetRules(preset);
}

/**
 * Dark mode için preset token'larını <style> tag'ine inject eder.
 * Bu, :root.dark selector'ının preset değerlerini override etmesini sağlar.
 */
let injectedPresetId: string | null = null;
function injectDarkPresetRules(preset: ThemePreset): void {
  if (typeof document === "undefined") return;
  if (injectedPresetId === preset.id) return;

  const STYLE_ID = "theme-preset-dark-rules";
  let styleEl = document.getElementById(STYLE_ID) as HTMLStyleElement | null;

  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = STYLE_ID;
    document.head.appendChild(styleEl);
  }

  const cssVars = Object.entries(preset.tokens.dark)
    .map(([key, value]) => `--${key}: ${value};`)
    .join("\n        ");

  styleEl.textContent = `
    :root.dark[data-theme-preset="${preset.id}"] {
        ${cssVars}
    }
  `;

  injectedPresetId = preset.id;
}

/**
 * Default temayı geri yükler (preset override'ı temizler).
 */
export function clearPresetFromDocument(): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  delete root.dataset.themePreset;
  const styleEl = document.getElementById("theme-preset-dark-rules");
  if (styleEl) styleEl.remove();
  injectedPresetId = null;
}

/**
 * Stored preset'i okur. Default: "default".
 */
export function readPresetFromDocument(): ThemePresetId {
  if (typeof document === "undefined") return "default";
  const value = document.documentElement.dataset.themePreset;
  return isThemePresetId(value) ? value : "default";
}

/**
 * Preset'i ID ile uygula. ID bulunamazsa no-op.
 */
export function applyPresetById(id: string | null | undefined): void {
  if (!id) return;
  const preset = getPresetById(id);
  if (preset) {
    applyPresetToDocument(preset);
  }
}

/**
 * Stored preset'i localStorage'dan oku ve uygula.
 * SSR-safe.
 */
export function restorePresetFromStorage(storageKey = "theme-preset"): ThemePresetId | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = window.localStorage.getItem(storageKey);
    if (isThemePresetId(stored)) {
      applyPresetById(stored);
      return stored;
    }
  } catch {
    // localStorage erişilemez (private mode vb.)
  }
  return null;
}

/**
 * Preset'i localStorage'a kaydet.
 */
export function persistPresetToStorage(id: ThemePresetId, storageKey = "theme-preset"): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey, id);
  } catch {
    // ignore
  }
}