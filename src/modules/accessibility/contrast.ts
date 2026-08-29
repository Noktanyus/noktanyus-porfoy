/**
 * @file WCAG Contrast Utility
 * @description F2: WCAG 2.2 AA/AAA contrast ratio hesaplayıcı.
 *              İki renk arasındaki oranı hesaplar; 4.5:1 (AA) ve
 *              7:1 (AAA) eşiklerine göre geçer/kalır.
 *
 *              Referans: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
 */

export type RGB = [number, number, number];

export type ContrastLevel = "fail" | "AA-large" | "AA" | "AAA";

export interface ContrastResult {
  ratio: number;
  level: ContrastLevel;
  passes: {
    AA: { normal: boolean; large: boolean };
    AAA: { normal: boolean; large: boolean };
  };
}

/**
 * Hex (#fff, #ffffff, #ffffffff) → RGB tuple.
 * Hata durumunda null döner.
 */
export function hexToRgb(hex: string): RGB | null {
  const cleaned = hex.replace("#", "").trim();
  if (![3, 6, 8].includes(cleaned.length)) return null;
  if (!/^[0-9a-fA-F]+$/.test(cleaned)) return null;

  if (cleaned.length === 3) {
    const r = parseInt(cleaned[0] + cleaned[0], 16);
    const g = parseInt(cleaned[1] + cleaned[1], 16);
    const b = parseInt(cleaned[2] + cleaned[2], 16);
    return [r, g, b];
  }
  if (cleaned.length === 6) {
    const r = parseInt(cleaned.slice(0, 2), 16);
    const g = parseInt(cleaned.slice(2, 4), 16);
    const b = parseInt(cleaned.slice(4, 6), 16);
    return [r, g, b];
  }
  // length === 8
  const r = parseInt(cleaned.slice(0, 2), 16);
  const g = parseInt(cleaned.slice(2, 4), 16);
  const b = parseInt(cleaned.slice(4, 6), 16);
  return [r, g, b];
}

/**
 * RGB tuple → hex string (#rrggbb)
 */
export function rgbToHex(rgb: RGB): string {
  const [r, g, b] = rgb;
  return (
    "#" +
    [r, g, b]
      .map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0"))
      .join("")
  );
}

/**
 * Relative luminance — WCAG formülü.
 * https://www.w3.org/WAI/GL/wiki/Relative_luminance
 */
export function relativeLuminance(rgb: RGB): number {
  const [r, g, b] = rgb.map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  }) as RGB;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * İki renk arasındaki contrast ratio.
 * Sonuç 1-21 arasında (1 = aynı, 21 = siyah/beyaz).
 */
export function contrastRatio(color1: RGB, color2: RGB): number {
  const l1 = relativeLuminance(color1);
  const l2 = relativeLuminance(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Hex string'lerle çalışan high-level API.
 * Sonuçta hem oran hem de WCAG seviyesi döner.
 */
export function checkContrast(hex1: string, hex2: string): ContrastResult | null {
  const c1 = hexToRgb(hex1);
  const c2 = hexToRgb(hex2);
  if (!c1 || !c2) return null;

  const ratio = contrastRatio(c1, c2);
  const passes = {
    AA: { normal: ratio >= 4.5, large: ratio >= 3 },
    AAA: { normal: ratio >= 7, large: ratio >= 4.5 },
  };

  let level: ContrastLevel = "fail";
  if (passes.AAA.normal) level = "AAA";
  else if (passes.AA.normal) level = "AA";
  else if (passes.AA.large) level = "AA-large";

  return { ratio, level, passes };
}

/**
 * Belirli bir oran için "AA Normal" mi "AA Large" mı yoksa "fail" mi
 * olduğunu döner. Text boyutuna göre kullanılır.
 *
 * - Normal text: < 18pt (regular) veya < 14pt (bold) → 4.5
 * - Large text: ≥ 18pt (regular) veya ≥ 14pt (bold) → 3
 *
 * 14pt ≈ 18.66px, 18pt ≈ 24px
 */
export function passesWCAG(
  ratio: number,
  fontSizePx: number,
  isBold = false
): { AA: boolean; AAA: boolean } {
  const isLarge = fontSizePx >= 24 || (isBold && fontSizePx >= 18);
  const thresholdAA = isLarge ? 3 : 4.5;
  const thresholdAAA = isLarge ? 4.5 : 7;
  return {
    AA: ratio >= thresholdAA,
    AAA: ratio >= thresholdAAA,
  };
}

/**
 * Accessible bir renk önerir. Eğer mevcut renk yeterli kontrasta sahip
 * değilse, onu siyah veya beyaza doğru karıştırarak düzeltir.
 */
export function suggestAccessibleColor(
  fg: string,
  bg: string,
  targetRatio = 4.5
): string | null {
  const fgRgb = hexToRgb(fg);
  const bgRgb = hexToRgb(bg);
  if (!fgRgb || !bgRgb) return null;

  if (contrastRatio(fgRgb, bgRgb) >= targetRatio) return fg;

  // Siyaha ya da beyaza doğru interpolasyon dene
  const black: RGB = [0, 0, 0];
  const white: RGB = [255, 255, 255];

  for (let t = 0; t <= 1; t += 0.05) {
    const candidate: RGB = [
      fgRgb[0] * t + black[0] * (1 - t),
      fgRgb[1] * t + black[1] * (1 - t),
      fgRgb[2] * t + black[2] * (1 - t),
    ];
    if (contrastRatio(candidate, bgRgb) >= targetRatio) {
      return rgbToHex(candidate);
    }

    const candidateW: RGB = [
      fgRgb[0] * t + white[0] * (1 - t),
      fgRgb[1] * t + white[1] * (1 - t),
      fgRgb[2] * t + white[2] * (1 - t),
    ];
    if (contrastRatio(candidateW, bgRgb) >= targetRatio) {
      return rgbToHex(candidateW);
    }
  }

  return null;
}