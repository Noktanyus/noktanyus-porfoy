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
 * Hex → OKLCH dönüşümü.
 *
 * Kullanım amacı: Tailwind config OKLCH token sistemi ile çalışır.
 * Branding UI'dan alınan hex renkleri CSS variable olarak inject edilirken
 * OKLCH formatına çevrilir → renklerin tutarlılığı ve palette generation.
 *
 * Algoritma:
 * 1. Hex → linearize sRGB (gamma correction)
 * 2. Linear RGB → XYZ (D65)
 * 3. XYZ → Oklab (Björn Ottosson, 2020)
 * 4. Oklab → OKLCH (cylindrical form)
 *
 * Hassasiyet: Δ < 0.005 her kanal için (perceptual uniform).
 *
 * Referans: https://bottosson.github.io/posts/oklab/
 */
export function hexToOklch(hex: string): string {
  const cleaned = hex.replace("#", "").trim();
  if (!isValidHexColor(hex)) {
    throw new Error(`Invalid hex color: ${hex}`);
  }

  // 3-char shorthand → 6-char expansion
  const full =
    cleaned.length === 3
      ? cleaned.split("").map((c) => c + c).join("")
      : cleaned.length === 8
        ? cleaned.slice(0, 6)
        : cleaned;

  const rByte = parseInt(full.slice(0, 2), 16);
  const gByte = parseInt(full.slice(2, 4), 16);
  const bByte = parseInt(full.slice(4, 6), 16);

  // sRGB → linear RGB (gamma correction)
  const linearize = (c: number): number => {
    const cs = c / 255;
    return cs <= 0.04045 ? cs / 12.92 : Math.pow((cs + 0.055) / 1.055, 2.4);
  };
  const r = linearize(rByte);
  const g = linearize(gByte);
  const b = linearize(bByte);

  // Linear RGB → Oklab (Björn Ottosson matrix)
  const l_ = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m_ = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s_ = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);

  const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
  const a = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
  const bb = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;

  // Oklab → OKLCH (cylindrical)
  const C = Math.sqrt(a * a + bb * bb);
  let H = Math.atan2(bb, a) * (180 / Math.PI);
  if (H < 0) H += 360;

  // CSS oklch() format: oklch(L C H) — L ve C 0-1 arası normalize
  // L = 0-1, C = 0-0.4 (yaklaşık), H = 0-360
  const lStr = L.toFixed(4);
  const cStr = C.toFixed(4);
  const hStr = H.toFixed(2);

  return `oklch(${lStr} ${cStr} ${hStr})`;
}

/**
 * OKLCH → hex (gerekirse reverse conversion).
 * Şu an kullanılmıyor, ileride palette generator için hazır.
 */
export function oklchToHex(oklch: string): string {
  const match = oklch.match(/oklch\(\s*([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)/);
  if (!match) throw new Error(`Invalid oklch: ${oklch}`);
  const L = parseFloat(match[1]);
  const C = parseFloat(match[2]);
  const H = parseFloat(match[3]);

  const hRad = (H * Math.PI) / 180;
  const a = C * Math.cos(hRad);
  const bb = C * Math.sin(hRad);

  // Oklab → linear RGB (ters matris)
  const l_ = L + 0.3963377774 * a + 0.2158037573 * bb;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * bb;
  const s_ = L - 0.0894841775 * a - 1.291485548 * bb;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  let r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  let g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  let b = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;

  // Linear → sRGB (gamma)
  const gamma = (c: number): number => {
    const cs = Math.max(0, Math.min(1, c));
    return cs <= 0.0031308
      ? cs * 12.92
      : 1.055 * Math.pow(cs, 1 / 2.4) - 0.055;
  };
  r = Math.round(gamma(r) * 255);
  g = Math.round(gamma(g) * 255);
  b = Math.round(gamma(b) * 255);

  const toHex = (n: number) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}