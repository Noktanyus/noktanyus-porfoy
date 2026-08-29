/**
 * @file Branding Schemas & Types
 * @description F4: Custom branding için veri yapıları.
 *              Workspace başına özelleştirilebilir:
 *              - Logo (URL)
 *              - Primary/accent renkler
 *              - Font ailesi
 *              - Custom CSS
 */

export type FontFamily = "inter" | "roboto" | "poppins" | "system";

export interface BrandingConfig {
  workspaceId: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string;
  accentColor: string;
  fontFamily: FontFamily;
  customCss: string | null;
  /** Marka sloganı */
  tagline: string | null;
  /** Sosyal medya linkleri */
  socialLinks: {
    twitter?: string;
    github?: string;
    linkedin?: string;
    instagram?: string;
  };
  updatedAt: Date;
}

/**
 * Default branding değerleri — ilk kurulumda veya sıfırlamada kullanılır.
 */
export const DEFAULT_BRANDING: Omit<BrandingConfig, "workspaceId" | "updatedAt"> = {
  logoUrl: null,
  faviconUrl: null,
  primaryColor: "#3b82f6", // blue-500
  accentColor: "#a855f7", // purple-500
  fontFamily: "inter",
  customCss: null,
  tagline: null,
  socialLinks: {},
};

export const FONT_OPTIONS: ReadonlyArray<{
  value: FontFamily;
  label: string;
  cssValue: string;
  weights: ReadonlyArray<number>;
}> = [
  {
    value: "inter",
    label: "Inter",
    cssValue: '"Inter", system-ui, sans-serif',
    weights: [400, 500, 600, 700, 800],
  },
  {
    value: "roboto",
    label: "Roboto",
    cssValue: '"Roboto", system-ui, sans-serif',
    weights: [300, 400, 500, 700, 900],
  },
  {
    value: "poppins",
    label: "Poppins",
    cssValue: '"Poppins", system-ui, sans-serif',
    weights: [300, 400, 500, 600, 700, 800],
  },
  {
    value: "system",
    label: "Sistem",
    cssValue: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    weights: [400, 500, 600, 700],
  },
] as const;

export function getFontByValue(value: FontFamily) {
  return FONT_OPTIONS.find((f) => f.value === value);
}

export function isFontFamily(value: unknown): value is FontFamily {
  return typeof value === "string" && FONT_OPTIONS.some((f) => f.value === value);
}

/**
 * Hex renk validasyonu. #rgb, #rrggbb, #rrggbbaa destekler.
 */
export function isValidHexColor(value: unknown): value is string {
  if (typeof value !== "string") return false;
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(value);
}

/**
 * Hex renkten oklch'e çevirme. Tailwind config ile uyumlu.
 * Sadece hue/chroma kararlı kalır, lightness biraz değişir.
 *
 * Not: Basitleştirilmiş dönüşüm. Doğrudan HEX kullanmak da mümkün.
 */
export function hexToOklch(hex: string): string {
  // Bu basit bir fallback — Tailwind config'i HEX'i OKLCH'ye çevirebilir.
  // Branding için HEX kullanımı daha okunabilir olduğundan burada olduğu gibi bırakıyoruz.
  return hex;
}