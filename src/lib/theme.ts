/**
 * @file Theme constants & helpers
 * @description Light/dark/system theme options, accent color mapping ve
 *              white-label theme preset sistemi.
 *
 *  - next-themes "light | dark | system" degerleri
 *  - Accent renkleri (5 preset)
 *  - THEME_PRESETS — white-label temalar (primary, accent, bg, text)
 *  - generateThemeCSS — workspace brand override uretici
 */

export type ThemeOption = "light" | "dark" | "system";

export type AccentColor = "blue" | "purple" | "green" | "orange" | "pink";

// =================== THEME PRESETS (White-Label) ===================

/**
 * Beyaz etiket / marka temalari. Workspace basina bir tema secilir ve
 * generateThemeCSS ile :root uzerinde --brand-primary, --brand-accent,
 * --brand-bg, --brand-text degiskenleri set edilir.
 *
 * Renkler HEX formatinda — Tailwind/PostCSS ile birebir uyumlu.
 * Dark tema bg/text ters cevrilmis sekilde — koyu arkaplan + acik metin.
 */
export interface ThemePresetConfig {
  primary: string;
  accent: string;
  bg: string;
  text: string;
}

export const THEME_PRESETS = {
  modern: {
    primary: "#4f46e5",
    accent: "#06b6d4",
    bg: "#ffffff",
    text: "#0f172a",
  },
  minimalist: {
    primary: "#0f172a",
    accent: "#64748b",
    bg: "#ffffff",
    text: "#0f172a",
  },
  vibrant: {
    primary: "#ec4899",
    accent: "#f59e0b",
    bg: "#ffffff",
    text: "#0f172a",
  },
  corporate: {
    primary: "#1e40af",
    accent: "#0891b2",
    bg: "#f8fafc",
    text: "#0f172a",
  },
  dark: {
    primary: "#8b5cf6",
    accent: "#22d3ee",
    bg: "#0f172a",
    text: "#f1f5f9",
  },
} as const satisfies Record<string, ThemePresetConfig>;

export type ThemePresetKey = keyof typeof THEME_PRESETS;

/** Desteklenen tema preset adlari. Dogrulama + UI select icin. */
export const THEME_PRESET_KEYS: ReadonlyArray<ThemePresetKey> = [
  "modern",
  "minimalist",
  "vibrant",
  "corporate",
  "dark",
] as const;

/** Preset adinin gecerli olup olmadigini kontrol eder. */
export function isThemePresetKey(value: unknown): value is ThemePresetKey {
  return (
    typeof value === "string" &&
    (THEME_PRESET_KEYS as ReadonlyArray<string>).includes(value)
  );
}

// =================== LEGACY: next-themes + Accent ===================

/**
 * UI'da gosterilecek tema secenekleri. next-themes'in anladigi degerleri kullanir.
 */
export const THEME_OPTIONS: ReadonlyArray<{ value: ThemeOption; label: string; description: string }> = [
  { value: "light", label: "Açık", description: "Her zaman aydınlık tema" },
  { value: "dark", label: "Koyu", description: "Her zaman karanlık tema" },
  { value: "system", label: "Sistem", description: "Cihaz ayarını takip et" },
] as const;

/**
 * Desteklenen accent renkleri. `--accent` CSS variable uzerinden UI'a uygulanir.
 * - `token`: Tailwind theme color token (CSS var referansi)
 * - `hex`: saf hex degeri (inline kullanım veya color picker icin)
 */
export const ACCENT_COLORS: ReadonlyArray<{
  value: AccentColor;
  label: string;
  token: string;
  hex: string;
  oklchLight: string;
  oklchDark: string;
  ringClass: string;
}> = [
  { value: "blue",   label: "Mavi",    token: "blue",   hex: "#3b82f6", oklchLight: "0.55 0.18 255", oklchDark: "0.7 0.15 255", ringClass: "ring-blue-500" },
  { value: "purple", label: "Mor",     token: "purple", hex: "#a855f7", oklchLight: "0.55 0.22 300", oklchDark: "0.7 0.18 300", ringClass: "ring-purple-500" },
  { value: "green",  label: "Yeşil",   token: "green",  hex: "#22c55e", oklchLight: "0.60 0.18 145", oklchDark: "0.7 0.16 145", ringClass: "ring-green-500" },
  { value: "orange", label: "Turuncu", token: "orange", hex: "#f97316", oklchLight: "0.62 0.19 45",  oklchDark: "0.72 0.18 45",  ringClass: "ring-orange-500" },
  { value: "pink",   label: "Pembe",   token: "pink",   hex: "#ec4899", oklchLight: "0.60 0.22 350", oklchDark: "0.72 0.19 350", ringClass: "ring-pink-500" },
] as const;

/**
 * Accent rengi icin CSS variable degerini hex formatinda doner.
 * document.documentElement.style.setProperty('--accent', hex) ile uygulanir.
 */
export function getAccentHex(accent: AccentColor): string {
  return ACCENT_COLORS.find((c) => c.value === accent)?.hex ?? "#3b82f6";
}

/**
 * Accent rengi icin Tailwind utility class'larini doner (primary/secondary).
 * Buttons, badges vb. accent token'i kullanir.
 */
export function getAccentColorClasses(accent: AccentColor): {
  text: string;
  bg: string;
  hover: string;
  ring: string;
} {
  const map: Record<AccentColor, { text: string; bg: string; hover: string; ring: string }> = {
    blue: {
      text: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-600",
      hover: "hover:bg-blue-700",
      ring: "ring-blue-500",
    },
    purple: {
      text: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-600",
      hover: "hover:bg-purple-700",
      ring: "ring-purple-500",
    },
    green: {
      text: "text-green-600 dark:text-green-400",
      bg: "bg-green-600",
      hover: "hover:bg-green-700",
      ring: "ring-green-500",
    },
    orange: {
      text: "text-orange-600 dark:text-orange-400",
      bg: "bg-orange-600",
      hover: "hover:bg-orange-700",
      ring: "ring-orange-500",
    },
    pink: {
      text: "text-pink-600 dark:text-pink-400",
      bg: "bg-pink-600",
      hover: "hover:bg-pink-700",
      ring: "ring-pink-500",
    },
  };
  return map[accent] ?? map.blue;
}

/**
 * Accent degerinin gecerli olup olmadigini kontrol eder.
 * API boundary'lerinde validate icin kullanilir.
 */
export function isAccentColor(value: unknown): value is AccentColor {
  return typeof value === "string" && ACCENT_COLORS.some((c) => c.value === value);
}

/**
 * Theme degerinin gecerli olup olmadigini kontrol eder.
 */
export function isThemeOption(value: unknown): value is ThemeOption {
  return typeof value === "string" && THEME_OPTIONS.some((o) => o.value === value);
}

/**
 * Accent degisikliklerini document uzerinde uygular.
 * --primary, --brand-primary, --ring ve --accent-hex variable'larini set eder.
 * SSR-safe: window/document yoksa no-op.
 */
export function applyAccentToDocument(accent: AccentColor): void {
  if (typeof document === "undefined") return;
  const item = ACCENT_COLORS.find((c) => c.value === accent);
  const hex = item?.hex ?? "#3b82f6";
  const isDark = document.documentElement.classList.contains('dark');
  const oklch = isDark ? (item?.oklchDark ?? "0.7 0.15 255") : (item?.oklchLight ?? "0.55 0.18 255");

  const root = document.documentElement;
  root.style.setProperty("--accent", hex);
  root.style.setProperty("--accent-hex", hex);
  root.style.setProperty("--accent-ring", hex);
  root.style.setProperty("--primary", oklch);
  root.style.setProperty("--brand-primary", oklch);
  root.style.setProperty("--ring", oklch);
  root.dataset.accent = accent;
}

/**
 * Stored accent'i okur. Default: "blue".
 */
export function readAccentFromDocument(): AccentColor {
  if (typeof document === "undefined") return "blue";
  const value = document.documentElement.dataset.accent;
  return isAccentColor(value) ? value : "blue";
}

// =================== THEME PRESET CSS GENERATION ===================

/**
 * Hex formatindaki bir rengi dogru formatta yaz. 3-haneli kisaltma destegi.
 * Gecersiz input fallback olarak verilen default'u doner.
 */
function normalizeHex(value: string, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const v = value.trim();
  if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v)) return v;
  return fallback;
}

/**
 * Bir tema preset adina gore THEME_PRESETS'ten config doner. Bilinmeyen
 * adlar "modern" fallback'ine duserek sessizce normalizer gibi davranir.
 */
export function getThemePreset(themeKey: string | null | undefined): ThemePresetConfig {
  if (isThemePresetKey(themeKey)) {
    return THEME_PRESETS[themeKey];
  }
  return THEME_PRESETS.modern;
}

/**
 * Theme preset + opsiyonel override -> :root CSS string'i uretir.
 * BrandingProvider bu string'i <style> etiketine inject eder.
 *
 * Override mantigi:
 *   - Her alan (primary/accent/bg/text) opsiyonel olabilir.
 *   - Set edilmisse preset'ten gelen degerin ustune yazilir.
 *   - Hex formati degilse sessizce preset degeri korunur (XSS hardening).
 *
 * Ornek output:
 *   :root {
 *     --brand-primary: #4f46e5;
 *     --brand-accent: #06b6d4;
 *     --brand-bg: #ffffff;
 *     --brand-text: #0f172a;
 *   }
 */
export function generateThemeCSS(
  themeKey: string | null | undefined,
  overrides?: Partial<ThemePresetConfig>
): string {
  const base = getThemePreset(themeKey);

  const primary = normalizeHex(overrides?.primary ?? "", base.primary) || base.primary;
  const accent = normalizeHex(overrides?.accent ?? "", base.accent) || base.accent;
  const bg = normalizeHex(overrides?.bg ?? "", base.bg) || base.bg;
  const text = normalizeHex(overrides?.text ?? "", base.text) || base.text;

  return `:root {\n  --brand-primary: ${primary};\n  --brand-accent: ${accent};\n  --brand-bg: ${bg};\n  --brand-text: ${text};\n}`;
}
