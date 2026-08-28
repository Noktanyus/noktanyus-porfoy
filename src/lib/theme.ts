/**
 * @file Theme constants & helpers
 * @description Light/dark/system theme options ve accent color mapping.
 *              next-themes `light | dark | system` uyumlu olacak sekilde tanimlandi.
 */

export type ThemeOption = "light" | "dark" | "system";

export type AccentColor = "blue" | "purple" | "green" | "orange" | "pink";

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
  ringClass: string;
}> = [
  { value: "blue",   label: "Mavi",    token: "blue",   hex: "#3b82f6", ringClass: "ring-blue-500" },
  { value: "purple", label: "Mor",     token: "purple", hex: "#a855f7", ringClass: "ring-purple-500" },
  { value: "green",  label: "Yeşil",   token: "green",  hex: "#22c55e", ringClass: "ring-green-500" },
  { value: "orange", label: "Turuncu", token: "orange", hex: "#f97316", ringClass: "ring-orange-500" },
  { value: "pink",   label: "Pembe",   token: "pink",   hex: "#ec4899", ringClass: "ring-pink-500" },
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
 * --accent, --accent-ring CSS variable'larini set eder.
 * SSR-safe: window/document yoksa no-op.
 */
export function applyAccentToDocument(accent: AccentColor): void {
  if (typeof document === "undefined") return;
  const hex = getAccentHex(accent);
  const root = document.documentElement;
  root.style.setProperty("--accent", hex);
  root.style.setProperty("--accent-ring", hex);
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