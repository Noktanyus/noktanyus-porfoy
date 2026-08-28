/**
 * @file Accessibility (a11y) Helpers — WCAG 2.2 AA
 *
 * Odaklanilan alanlar:
 *   - FOCUS_RING_STYLE: tutarli focus-visible Tailwind class'lari
 *   - aria props helpers: form elementleri icin label / describedBy
 *   - validateA11y: HTML string uzerinde temel erisilebilirlik kontrolu
 *
 * Referanslar:
 *   - https://www.w3.org/WAI/ARIA/apg/ — WAI-ARIA Authoring Practices
 *   - https://www.w3.org/TR/WCAG22/ — WCAG 2.2
 */

/**
 * Tutarli focus ring icin Tailwind class'lari.
 * focus-visible sadece klavye navigasyonunda gorunur (mouse click'inde degil).
 */
export const FOCUS_RING_STYLE =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2';

export const FOCUS_RING_DARK =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900';

/**
 * Klavye ile erisilebilir skip target ID. Layout'taki <main id="main-content"> ile eslesmeli.
 */
export const SKIP_TARGET_ID = 'main-content';
export const SKIP_LINK_LABEL = 'İçeriğe geç';

/**
 * Form field icin label props uretir.
 * Kullanim: <input {...labelProps('email')} id="email" />
 */
export function labelProps(fieldId: string): { 'aria-labelledby': string } {
  return { 'aria-labelledby': `${fieldId}-label` };
}

/**
 * Form field icin description props uretir (yardim metni / hata mesaji gibi).
 * descriptionId: aciklayan elementin ID'si. aria-describedby ile baglanir.
 */
export function describedByProps(descriptionId?: string): { 'aria-describedby'?: string } {
  if (!descriptionId) return {};
  return { 'aria-describedby': descriptionId };
}

/**
 * Gerekli alan icin aria-required. HTML required attribute'i ile birlikte kullanilir.
 */
export function requiredProps(isRequired: boolean): { 'aria-required': 'true' | 'false' } {
  return { 'aria-required': isRequired ? 'true' : 'false' };
}

/**
 * Gecersiz alan icin aria-invalid. hata mesaji aria-describedby ile baglanir.
 */
export function invalidProps(isInvalid: boolean): { 'aria-invalid': 'true' | 'false' } {
  return { 'aria-invalid': isInvalid ? 'true' : 'false' };
}

/**
 * Hata mesaji ID uretir. inputId + "-error" formatinda.
 */
export function errorMessageId(inputId: string): string {
  return `${inputId}-error`;
}

/**
 * Aciklama/helper text ID uretir.
 */
export function helperTextId(inputId: string): string {
  return `${inputId}-helper`;
}

/**
 * Button aria-label uretir. Eger butonun gorunur metni yoksa aria-label ZORUNLUDUR.
 * - text: button metni (varsa aria-label kullanmaya gerek yok)
 * - fallbackLabel: icon-only button icin
 */
export function buttonLabel(text?: string, fallbackLabel?: string): { 'aria-label'?: string } {
  if (text) return {};
  if (fallbackLabel) return { 'aria-label': fallbackLabel };
  return {};
}

/**
 * Live region politikasi. polite = onemli olmayan guncellemeler (bildirim),
 * assertive = kritik hata mesajlari (ekran okuyucu hemen okur).
 */
export type LiveRegionPoliteness = 'off' | 'polite' | 'assertive';

export function liveRegionProps(
  politeness: LiveRegionPoliteness = 'polite'
): { 'aria-live': LiveRegionPoliteness; 'aria-atomic'?: 'true' } {
  return { 'aria-live': politeness, 'aria-atomic': 'true' };
}

/**
 * Busy state (yukleniyor). aria-busy ile birlikte aria-live kullanilir.
 */
export function busyProps(isBusy: boolean): { 'aria-busy': 'true' | 'false' } {
  return { 'aria-busy': isBusy ? 'true' : 'false' };
}

/**
 * Expandable (dropdown/accordion) icin aria-expanded + aria-haspopup.
 */
export function expandableProps(
  isOpen: boolean,
  hasPopup: boolean | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog' = false
): { 'aria-expanded': 'true' | 'false'; 'aria-haspopup'?: 'true' | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog' } {
  return {
    'aria-expanded': isOpen ? 'true' : 'false',
    ...(hasPopup ? { 'aria-haspopup': hasPopup === true ? 'true' : hasPopup } : {}),
  };
}

// ============================================================
// validateA11y — Basic HTML Validation
// ============================================================

export interface A11yIssue {
  level: 'error' | 'warning';
  code: string;
  message: string;
  /** Element'in disklikli adi (ornek: '<img src="x.jpg">') */
  snippet: string;
}

export interface A11yReport {
  issues: A11yIssue[];
  errorCount: number;
  warningCount: number;
  passed: boolean;
}

/**
 * HTML string uzerinde temel erisilebilirlik kontrolleri yapar.
 * Kapsam: img alt, button/aria-label, heading hierarchy, link text, form labels.
 *
 * Bu fonksiyon tam kapsamli bir WCAG validatoru degildir (axe-core kullanilmalidir).
 * Ancak CI'da veya component test'lerinde hizli bir sanity check olarak kullanilabilir.
 */
export function validateA11y(html: string): A11yReport {
  const issues: A11yIssue[] = [];

  if (typeof html !== 'string' || html.length === 0) {
    return { issues: [], errorCount: 0, warningCount: 0, passed: true };
  }

  // 1. <img> without alt
  const imgRegex = /<img\b[^>]*>/gi;
  let match: RegExpExecArray | null;
  while ((match = imgRegex.exec(html)) !== null) {
    const tag = match[0];
    if (!/\salt\s*=\s*("[^"]*"|'[^']*')/i.test(tag)) {
      if (/\srole\s*=\s*["']presentation["']/i.test(tag) || /\srole\s*=\s*["']none["']/i.test(tag)) {
        // Decorative image — alt bos olabilir
        continue;
      }
      issues.push({
        level: 'error',
        code: 'IMG_MISSING_ALT',
        message: '<img> etiketi "alt" özniteliği içermiyor. Dekoratif ise alt="" veya role="presentation" kullanın.',
        snippet: tag.length > 80 ? tag.slice(0, 77) + '...' : tag,
      });
    }
  }

  // 2. <button> without accessible label
  const buttonRegex = /<button\b[^>]*>[\s\S]*?<\/button>/gi;
  while ((match = buttonRegex.exec(html)) !== null) {
    const tag = match[0];
    const inner = match[0].replace(/^<button\b[^>]*>/i, '').replace(/<\/button>$/i, '');
    const hasText = inner.trim().length > 0 && /[^\s<>]/.test(inner);
    const hasAriaLabel = /\saria-label\s*=\s*("[^"]+"|'[^']+')/i.test(tag);
    const hasAriaLabelledBy = /\saria-labelledby\s*=/i.test(tag);
    const hasTitle = /\stitle\s*=\s*("[^"]+"|'[^']+')/i.test(tag);

    if (!hasText && !hasAriaLabel && !hasAriaLabelledBy && !hasTitle) {
      issues.push({
        level: 'error',
        code: 'BUTTON_NO_LABEL',
        message: '<button> etiketinin erişilebilir bir etiketi yok. İçerik, aria-label veya aria-labelledby ekleyin.',
        snippet: tag.length > 80 ? tag.slice(0, 77) + '...' : tag,
      });
    }
  }

  // 3. <a> without accessible label
  const anchorRegex = /<a\b[^>]*>[\s\S]*?<\/a>/gi;
  while ((match = anchorRegex.exec(html)) !== null) {
    const tag = match[0];
    const inner = match[0].replace(/^<a\b[^>]*>/i, '').replace(/<\/a>$/i, '');
    const hasText = inner.trim().length > 0 && /[^\s<>]/.test(inner);
    const hasAriaLabel = /\saria-label\s*=\s*("[^"]+"|'[^']+')/i.test(tag);
    const hasImg = /<img\b/i.test(inner);

    if (!hasText && !hasAriaLabel && !hasImg) {
      issues.push({
        level: 'error',
        code: 'LINK_NO_LABEL',
        message: '<a> etiketinin erişilebilir bir etiketi yok. İçerik veya aria-label ekleyin.',
        snippet: tag.length > 80 ? tag.slice(0, 77) + '...' : tag,
      });
    }
  }

  // 4. <input> without associated label
  // Hidden/submit/button/reset/image type inputs label gerektirmez.
  const inputRegex = /<input\b[^>]*>/gi;
  const SKIP_INPUT_TYPES = new Set(['hidden', 'submit', 'button', 'reset', 'image']);
  while ((match = inputRegex.exec(html)) !== null) {
    const tag = match[0];
    const typeMatch = /\btype\s*=\s*["']([^"']+)["']/i.exec(tag);
    const typeValue = typeMatch?.[1]?.toLowerCase() ?? 'text';
    if (SKIP_INPUT_TYPES.has(typeValue)) continue;

    const idMatch = /\bid\s*=\s*["']([^"']+)["']/i.exec(tag);
    const id = idMatch?.[1];
    const hasAriaLabel = /\saria-label\s*=\s*("[^"]+"|'[^']+')/i.test(tag);
    const hasAriaLabelledBy = /\saria-labelledby\s*=/i.test(tag);

    if (!id) {
      issues.push({
        level: 'warning',
        code: 'INPUT_NO_ID',
        message: '<input> etiketinin "id" özniteliği yok (label ilişkilendirilemiyor).',
        snippet: tag.length > 80 ? tag.slice(0, 77) + '...' : tag,
      });
    } else if (!hasAriaLabel && !hasAriaLabelledBy) {
      // Check for <label for="id"> in surrounding HTML
      const labelRegex = new RegExp(`<label\\b[^>]*\\bfor\\s*=\\s*["']${id}["']`, 'i');
      if (!labelRegex.test(html)) {
        issues.push({
          level: 'warning',
          code: 'INPUT_NO_LABEL',
          message: `<input id="${id}"> ile ilişkilendirilmiş <label for="${id}">, aria-label veya aria-labelledby bulunamadı.`,
          snippet: tag.length > 80 ? tag.slice(0, 77) + '...' : tag,
        });
      }
    }
  }

  // 5. Heading hierarchy — h1 should appear before h2 without skipping
  const headingRegex = /<h([1-6])\b[^>]*>/gi;
  const headings: number[] = [];
  while ((match = headingRegex.exec(html)) !== null) {
    const level = parseInt(match[1], 10);
    headings.push(level);
  }
  for (let i = 1; i < headings.length; i++) {
    if (headings[i] > headings[i - 1] + 1) {
      issues.push({
        level: 'warning',
        code: 'HEADING_SKIP',
        message: `Başlık hiyerarşisi atlandı: h${headings[i - 1]} -> h${headings[i]}. Sıralı gidin (örn. h2 -> h3).`,
        snippet: `h${headings[i - 1]} -> h${headings[i]}`,
      });
    }
  }

  const errorCount = issues.filter((i) => i.level === 'error').length;
  const warningCount = issues.filter((i) => i.level === 'warning').length;

  return {
    issues,
    errorCount,
    warningCount,
    passed: errorCount === 0,
  };
}