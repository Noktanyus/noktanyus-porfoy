/**
 * @file Theme Preset Registry
 * @description Tüm tema varyantlarının OKLCH token değerleri. CSS variables'a
 *              runtime'da inject edilir — Tailwind'in `oklch(var(--xxx))` yapısı
 *              ile tam uyumlu. Her preset hem light hem dark varyant içerir.
 *
 *              Yeni preset eklemek için: PRESETS'e yeni obje ekle yeter.
 *              Admin UI otomatik olarak listeleyecek.
 *
 * Not: OKLCH formatı `0.xx 0.xx hue` şeklinde 3 değerden oluşur.
 * - L (lightness): 0-1 arası
 * - C (chroma): 0-0.4 arası
 * - H (hue): 0-360 derece
 */

export type ThemePresetId =
  | "default"
  | "ocean"
  | "sunset"
  | "forest"
  | "rose"
  | "midnight";

export interface ThemePresetTokens {
  // Light mode tokens
  light: {
    background: string;
    foreground: string;
    card: string;
    "card-foreground": string;
    popover: string;
    "popover-foreground": string;
    primary: string;
    "primary-foreground": string;
    secondary: string;
    "secondary-foreground": string;
    muted: string;
    "muted-foreground": string;
    accent: string;
    "accent-foreground": string;
    destructive: string;
    success: string;
    warning: string;
    info: string;
    border: string;
    input: string;
    ring: string;
  };
  dark: {
    background: string;
    foreground: string;
    card: string;
    "card-foreground": string;
    popover: string;
    "popover-foreground": string;
    primary: string;
    "primary-foreground": string;
    secondary: string;
    "secondary-foreground": string;
    muted: string;
    "muted-foreground": string;
    accent: string;
    "accent-foreground": string;
    destructive: string;
    success: string;
    warning: string;
    info: string;
    border: string;
    input: string;
    ring: string;
  };
}

export interface ThemePreset {
  id: ThemePresetId;
  label: string;
  description: string;
  /** Emoji ya da kısa etiket — admin dropdown için */
  badge: string;
  tokens: ThemePresetTokens;
}

/**
 * Preset koleksiyonu. Yeni tema ekle → listede görünür.
 */
export const PRESETS: ReadonlyArray<ThemePreset> = [
  {
    id: "default",
    label: "Varsayılan",
    description: "Mavi tonlarında modern, profesyonel görünüm",
    badge: "🔵",
    tokens: {
      // Light — Mavi tonları (chromaticity ~250-260)
      light: {
        background: "0.99 0.005 250",
        foreground: "0.18 0.01 250",
        card: "1 0 0 / 0.7",
        "card-foreground": "0.18 0.01 250",
        popover: "1 0 0 / 0.85",
        "popover-foreground": "0.18 0.01 250",
        primary: "0.55 0.18 255",
        "primary-foreground": "0.99 0 0",
        secondary: "0.96 0.005 250",
        "secondary-foreground": "0.25 0.01 250",
        muted: "0.95 0.005 250",
        "muted-foreground": "0.5 0.01 250",
        accent: "0.94 0.02 255",
        "accent-foreground": "0.25 0.01 250",
        destructive: "0.6 0.22 25",
        success: "0.65 0.18 145",
        warning: "0.78 0.16 80",
        info: "0.65 0.15 235",
        border: "0.92 0.005 250",
        input: "0.92 0.005 250",
        ring: "0.55 0.18 255",
      },
      dark: {
        background: "0.12 0.01 250",
        foreground: "0.96 0.005 250",
        card: "0.18 0.01 250 / 0.6",
        "card-foreground": "0.96 0.005 250",
        popover: "0.18 0.01 250 / 0.8",
        "popover-foreground": "0.96 0.005 250",
        primary: "0.7 0.15 255",
        "primary-foreground": "0.12 0.01 250",
        secondary: "0.18 0.01 250",
        "secondary-foreground": "0.92 0.005 250",
        muted: "0.18 0.01 250",
        "muted-foreground": "0.65 0.01 250",
        accent: "0.22 0.02 255",
        "accent-foreground": "0.92 0.005 250",
        destructive: "0.55 0.22 25",
        success: "0.65 0.18 145",
        warning: "0.75 0.16 80",
        info: "0.7 0.13 235",
        border: "0.3 0.01 250",
        input: "0.3 0.01 250",
        ring: "0.7 0.15 255",
      },
    },
  },
  {
    id: "ocean",
    label: "Okyanus",
    description: "Turkuaz ve camgöbeği tonlarında serin, sakin palet",
    badge: "🌊",
    tokens: {
      // Light — Cyan/teal hue (~190-210)
      light: {
        background: "0.99 0.005 200",
        foreground: "0.16 0.02 220",
        card: "1 0 0 / 0.7",
        "card-foreground": "0.16 0.02 220",
        popover: "1 0 0 / 0.85",
        "popover-foreground": "0.16 0.02 220",
        primary: "0.65 0.15 195",
        "primary-foreground": "0.99 0 0",
        secondary: "0.95 0.01 200",
        "secondary-foreground": "0.25 0.02 220",
        muted: "0.94 0.01 200",
        "muted-foreground": "0.5 0.02 220",
        accent: "0.92 0.04 195",
        "accent-foreground": "0.25 0.02 220",
        destructive: "0.6 0.22 25",
        success: "0.65 0.18 165",
        warning: "0.78 0.16 80",
        info: "0.7 0.14 210",
        border: "0.9 0.01 200",
        input: "0.9 0.01 200",
        ring: "0.65 0.15 195",
      },
      dark: {
        background: "0.14 0.02 220",
        foreground: "0.96 0.01 200",
        card: "0.2 0.02 220 / 0.6",
        "card-foreground": "0.96 0.01 200",
        popover: "0.2 0.02 220 / 0.8",
        "popover-foreground": "0.96 0.01 200",
        primary: "0.72 0.13 195",
        "primary-foreground": "0.14 0.02 220",
        secondary: "0.2 0.02 220",
        "secondary-foreground": "0.92 0.01 200",
        muted: "0.2 0.02 220",
        "muted-foreground": "0.65 0.02 220",
        accent: "0.25 0.04 195",
        "accent-foreground": "0.92 0.01 200",
        destructive: "0.55 0.22 25",
        success: "0.65 0.18 165",
        warning: "0.75 0.16 80",
        info: "0.72 0.12 210",
        border: "0.32 0.02 220",
        input: "0.32 0.02 220",
        ring: "0.72 0.13 195",
      },
    },
  },
  {
    id: "sunset",
    label: "Gün Batımı",
    description: "Turuncu, kırmızı ve mor tonlarında sıcak palet",
    badge: "🌅",
    tokens: {
      // Light — Orange/red hue (~25-50)
      light: {
        background: "0.99 0.01 50",
        foreground: "0.18 0.04 30",
        card: "1 0 0 / 0.7",
        "card-foreground": "0.18 0.04 30",
        popover: "1 0 0 / 0.85",
        "popover-foreground": "0.18 0.04 30",
        primary: "0.65 0.22 35",
        "primary-foreground": "0.99 0 0",
        secondary: "0.96 0.02 50",
        "secondary-foreground": "0.25 0.04 30",
        muted: "0.95 0.02 50",
        "muted-foreground": "0.5 0.04 30",
        accent: "0.92 0.06 40",
        "accent-foreground": "0.25 0.04 30",
        destructive: "0.6 0.25 20",
        success: "0.65 0.18 145",
        warning: "0.8 0.18 75",
        info: "0.7 0.15 235",
        border: "0.92 0.02 50",
        input: "0.92 0.02 50",
        ring: "0.65 0.22 35",
      },
      dark: {
        background: "0.14 0.04 30",
        foreground: "0.96 0.02 50",
        card: "0.2 0.04 30 / 0.6",
        "card-foreground": "0.96 0.02 50",
        popover: "0.2 0.04 30 / 0.8",
        "popover-foreground": "0.96 0.02 50",
        primary: "0.72 0.2 35",
        "primary-foreground": "0.14 0.04 30",
        secondary: "0.2 0.04 30",
        "secondary-foreground": "0.92 0.02 50",
        muted: "0.2 0.04 30",
        "muted-foreground": "0.65 0.04 30",
        accent: "0.25 0.06 40",
        "accent-foreground": "0.92 0.02 50",
        destructive: "0.55 0.25 20",
        success: "0.65 0.18 145",
        warning: "0.78 0.18 75",
        info: "0.72 0.13 235",
        border: "0.32 0.04 30",
        input: "0.32 0.04 30",
        ring: "0.72 0.2 35",
      },
    },
  },
  {
    id: "forest",
    label: "Orman",
    description: "Yeşil ve kahverengi tonlarında doğal palet",
    badge: "🌲",
    tokens: {
      // Light — Green hue (~140-160)
      light: {
        background: "0.99 0.005 150",
        foreground: "0.16 0.02 145",
        card: "1 0 0 / 0.7",
        "card-foreground": "0.16 0.02 145",
        popover: "1 0 0 / 0.85",
        "popover-foreground": "0.16 0.02 145",
        primary: "0.55 0.18 150",
        "primary-foreground": "0.99 0 0",
        secondary: "0.95 0.01 150",
        "secondary-foreground": "0.25 0.02 145",
        muted: "0.94 0.01 150",
        "muted-foreground": "0.5 0.02 145",
        accent: "0.92 0.04 150",
        "accent-foreground": "0.25 0.02 145",
        destructive: "0.6 0.22 25",
        success: "0.65 0.2 145",
        warning: "0.78 0.16 80",
        info: "0.65 0.15 235",
        border: "0.9 0.01 150",
        input: "0.9 0.01 150",
        ring: "0.55 0.18 150",
      },
      dark: {
        background: "0.12 0.02 150",
        foreground: "0.96 0.005 150",
        card: "0.18 0.02 150 / 0.6",
        "card-foreground": "0.96 0.005 150",
        popover: "0.18 0.02 150 / 0.8",
        "popover-foreground": "0.96 0.005 150",
        primary: "0.65 0.18 150",
        "primary-foreground": "0.12 0.02 150",
        secondary: "0.18 0.02 150",
        "secondary-foreground": "0.92 0.005 150",
        muted: "0.18 0.02 150",
        "muted-foreground": "0.65 0.02 150",
        accent: "0.22 0.04 150",
        "accent-foreground": "0.92 0.005 150",
        destructive: "0.55 0.22 25",
        success: "0.65 0.2 145",
        warning: "0.75 0.16 80",
        info: "0.7 0.13 235",
        border: "0.3 0.02 150",
        input: "0.3 0.02 150",
        ring: "0.65 0.18 150",
      },
    },
  },
  {
    id: "rose",
    label: "Gül",
    description: "Pembe ve mor tonlarında zarif, romantik palet",
    badge: "🌹",
    tokens: {
      // Light — Pink hue (~340-360)
      light: {
        background: "0.99 0.01 350",
        foreground: "0.18 0.04 350",
        card: "1 0 0 / 0.7",
        "card-foreground": "0.18 0.04 350",
        popover: "1 0 0 / 0.85",
        "popover-foreground": "0.18 0.04 350",
        primary: "0.65 0.22 350",
        "primary-foreground": "0.99 0 0",
        secondary: "0.96 0.02 350",
        "secondary-foreground": "0.25 0.04 350",
        muted: "0.95 0.02 350",
        "muted-foreground": "0.5 0.04 350",
        accent: "0.92 0.06 350",
        "accent-foreground": "0.25 0.04 350",
        destructive: "0.6 0.22 25",
        success: "0.65 0.18 145",
        warning: "0.78 0.16 80",
        info: "0.65 0.15 235",
        border: "0.92 0.02 350",
        input: "0.92 0.02 350",
        ring: "0.65 0.22 350",
      },
      dark: {
        background: "0.14 0.04 350",
        foreground: "0.96 0.01 350",
        card: "0.2 0.04 350 / 0.6",
        "card-foreground": "0.96 0.01 350",
        popover: "0.2 0.04 350 / 0.8",
        "popover-foreground": "0.96 0.01 350",
        primary: "0.72 0.2 350",
        "primary-foreground": "0.14 0.04 350",
        secondary: "0.2 0.04 350",
        "secondary-foreground": "0.92 0.01 350",
        muted: "0.2 0.04 350",
        "muted-foreground": "0.65 0.04 350",
        accent: "0.25 0.06 350",
        "accent-foreground": "0.92 0.01 350",
        destructive: "0.55 0.22 25",
        success: "0.65 0.18 145",
        warning: "0.75 0.16 80",
        info: "0.72 0.13 235",
        border: "0.32 0.04 350",
        input: "0.32 0.04 350",
        ring: "0.72 0.2 350",
      },
    },
  },
  {
    id: "midnight",
    label: "Gece Yarısı",
    description: "Koyu mor ve mavi tonlarında mistik palet",
    badge: "🌌",
    tokens: {
      // Light — Indigo hue (~270-290)
      light: {
        background: "0.99 0.005 280",
        foreground: "0.16 0.04 285",
        card: "1 0 0 / 0.7",
        "card-foreground": "0.16 0.04 285",
        popover: "1 0 0 / 0.85",
        "popover-foreground": "0.16 0.04 285",
        primary: "0.5 0.22 285",
        "primary-foreground": "0.99 0 0",
        secondary: "0.96 0.01 280",
        "secondary-foreground": "0.25 0.04 285",
        muted: "0.95 0.01 280",
        "muted-foreground": "0.5 0.04 285",
        accent: "0.92 0.05 285",
        "accent-foreground": "0.25 0.04 285",
        destructive: "0.6 0.22 25",
        success: "0.65 0.18 145",
        warning: "0.78 0.16 80",
        info: "0.65 0.15 235",
        border: "0.92 0.01 280",
        input: "0.92 0.01 280",
        ring: "0.5 0.22 285",
      },
      dark: {
        background: "0.1 0.04 285",
        foreground: "0.96 0.01 280",
        card: "0.16 0.04 285 / 0.6",
        "card-foreground": "0.96 0.01 280",
        popover: "0.16 0.04 285 / 0.8",
        "popover-foreground": "0.96 0.01 280",
        primary: "0.7 0.2 285",
        "primary-foreground": "0.1 0.04 285",
        secondary: "0.16 0.04 285",
        "secondary-foreground": "0.92 0.01 280",
        muted: "0.16 0.04 285",
        "muted-foreground": "0.65 0.04 285",
        accent: "0.22 0.05 285",
        "accent-foreground": "0.92 0.01 280",
        destructive: "0.55 0.22 25",
        success: "0.65 0.18 145",
        warning: "0.75 0.16 80",
        info: "0.72 0.13 235",
        border: "0.28 0.04 285",
        input: "0.28 0.04 285",
        ring: "0.7 0.2 285",
      },
    },
  },
] as const;

export function getPresetById(id: ThemePresetId | string): ThemePreset | undefined {
  return PRESETS.find((p) => p.id === id);
}

export function isThemePresetId(value: unknown): value is ThemePresetId {
  return typeof value === "string" && PRESETS.some((p) => p.id === value);
}