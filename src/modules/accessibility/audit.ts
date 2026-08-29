/**
 * @file A11y Audit Rules
 * @description Basit WCAG 2.2 AA uyumlu audit kuralları. DOM üzerinde çalışır,
 *              jsdom ortamında da test edilebilir.
 *
 *              İleride axe-core entegrasyonu eklenecek; şimdilik manuel
 *              kontroller yeterli (img alt, button label, link href, vs).
 */

export type IssueSeverity = "critical" | "serious" | "moderate" | "minor";
export type WCAGLevel = "A" | "AA" | "AAA";

export interface A11yIssue {
  rule: string;
  severity: IssueSeverity;
  wcagLevel: WCAGLevel;
  message: string;
  element?: string;
  helpUrl?: string;
}

export interface A11yReport {
  issues: A11yIssue[];
  total: number;
  bySeverity: Record<IssueSeverity, number>;
  passedRules: string[];
  score: number; // 0-100
}

interface AuditRule {
  id: string;
  severity: IssueSeverity;
  wcagLevel: WCAGLevel;
  description: string;
  helpUrl: string;
  check: (root: ParentNode) => Element[];
}

const RULES: AuditRule[] = [
  {
    id: "img-alt",
    severity: "critical",
    wcagLevel: "A",
    description: "Tüm <img> öğelerinde alt attribute olmalı",
    helpUrl: "https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html",
    check: (root) =>
      Array.from(root.querySelectorAll("img")).filter((img) => {
        const alt = img.getAttribute("alt");
        return alt === null || alt === undefined;
      }),
  },
  {
    id: "button-name",
    severity: "critical",
    wcagLevel: "A",
    description: "Tüm <button> öğelerinde erişilebilir isim olmalı",
    helpUrl: "https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html",
    check: (root) =>
      Array.from(root.querySelectorAll("button")).filter((btn) => {
        const text = btn.textContent?.trim();
        const ariaLabel = btn.getAttribute("aria-label");
        const ariaLabelledBy = btn.getAttribute("aria-labelledby");
        return !text && !ariaLabel && !ariaLabelledBy;
      }),
  },
  {
    id: "link-name",
    severity: "serious",
    wcagLevel: "A",
    description: "Tüm <a> öğelerinde erişilebilir isim olmalı",
    helpUrl: "https://www.w3.org/WAI/WCAG22/Understanding/link-purpose-in-context.html",
    check: (root) =>
      Array.from(root.querySelectorAll("a[href]")).filter((link) => {
        const text = link.textContent?.trim();
        const ariaLabel = link.getAttribute("aria-label");
        return !text && !ariaLabel;
      }),
  },
  {
    id: "heading-order",
    severity: "moderate",
    wcagLevel: "AA",
    description: "Başlık hiyerarşisi sıralı olmalı (h1 → h2 → h3...)",
    helpUrl: "https://www.w3.org/WAI/WCAG22/Understanding/headings-and-labels.html",
    check: (root) => {
      const headings = Array.from(root.querySelectorAll("h1, h2, h3, h4, h5, h6"));
      const levels = headings.map((h) => parseInt(h.tagName[1]));
      const issues: Element[] = [];
      for (let i = 1; i < levels.length; i++) {
        if (levels[i] - levels[i - 1] > 1) {
          issues.push(headings[i]);
        }
      }
      return issues;
    },
  },
  {
    id: "html-lang",
    severity: "serious",
    wcagLevel: "A",
    description: "<html> lang attribute içermeli",
    helpUrl: "https://www.w3.org/WAI/WCAG22/Understanding/language-of-page.html",
    check: (root) => {
      const html = root.querySelector("html");
      return html && !html.getAttribute("lang") ? [html] : [];
    },
  },
  {
    id: "label-input",
    severity: "critical",
    wcagLevel: "A",
    description: "Form inputları label ile ilişkilendirilmeli",
    helpUrl: "https://www.w3.org/WAI/WCAG22/Understanding/labels-or-instructions.html",
    check: (root) => {
      const inputs = Array.from(
        root.querySelectorAll("input:not([type='hidden']):not([type='submit']):not([type='button']), select, textarea")
      );
      return inputs.filter((input) => {
        const id = input.getAttribute("id");
        const ariaLabel = input.getAttribute("aria-label");
        const ariaLabelledBy = input.getAttribute("aria-labelledby");
        const hasLabel = id && root.querySelector(`label[for='${id}']`);
        return !hasLabel && !ariaLabel && !ariaLabelledBy;
      });
    },
  },
  {
    id: "duplicate-id",
    severity: "moderate",
    wcagLevel: "A",
    description: "Aynı ID birden fazla öğede kullanılmamalı",
    helpUrl: "https://www.w3.org/WAI/WCAG22/Understanding/parsing.html",
    check: (root) => {
      const ids = new Map<string, number>();
      Array.from(root.querySelectorAll("[id]")).forEach((el) => {
        const id = el.getAttribute("id");
        if (id) ids.set(id, (ids.get(id) ?? 0) + 1);
      });
      const dupes: Element[] = [];
      ids.forEach((count, id) => {
        if (count > 1) {
          root.querySelectorAll(`#${CSS.escape(id)}`).forEach((el) => dupes.push(el));
        }
      });
      return dupes;
    },
  },
  {
    id: "aria-hidden-focus",
    severity: "serious",
    wcagLevel: "A",
    description: "aria-hidden=true öğeleri focusable olmamalı",
    helpUrl: "https://www.w3.org/WAI/WCAG22/Understanding/aria-hidden.html",
    check: (root) =>
      Array.from(root.querySelectorAll("[aria-hidden='true']")).filter((el) => {
        if (el.hasAttribute("tabindex")) return true;
        const tag = el.tagName.toLowerCase();
        return ["a", "button", "input", "select", "textarea"].includes(tag);
      }),
  },
];

/**
 * Verilen root element'in a11y auditini çalıştırır.
 * document veya herhangi bir parent element olabilir.
 */
export function runA11yAudit(root: ParentNode = document): A11yReport {
  const issues: A11yIssue[] = [];
  const passedRules: string[] = [];

  RULES.forEach((rule) => {
    const matches = rule.check(root);
    if (matches.length > 0) {
      matches.forEach((el) => {
        issues.push({
          rule: rule.id,
          severity: rule.severity,
          wcagLevel: rule.wcagLevel,
          message: rule.description,
          element: el.outerHTML?.slice(0, 200),
          helpUrl: rule.helpUrl,
        });
      });
    } else {
      passedRules.push(rule.id);
    }
  });

  const bySeverity: Record<IssueSeverity, number> = {
    critical: 0,
    serious: 0,
    moderate: 0,
    minor: 0,
  };
  issues.forEach((i) => {
    bySeverity[i.severity]++;
  });

  // Score: critical=−15, serious=−8, moderate=−3, minor=−1
  const penalties = bySeverity.critical * 15 + bySeverity.serious * 8 + bySeverity.moderate * 3 + bySeverity.minor * 1;
  const score = Math.max(0, 100 - penalties);

  return {
    issues,
    total: issues.length,
    bySeverity,
    passedRules,
    score,
  };
}

/**
 * Severity'ye göre filtrele.
 */
export function filterBySeverity(
  report: A11yReport,
  minSeverity: IssueSeverity
): A11yIssue[] {
  const order: IssueSeverity[] = ["minor", "moderate", "serious", "critical"];
  const minIdx = order.indexOf(minSeverity);
  return report.issues.filter((i) => order.indexOf(i.severity) >= minIdx);
}

/**
 * Raporun WCAG uyumlu olup olmadığını kontrol eder.
 * - critical/serious issue varsa → non-compliant
 * - sadece moderate/minor varsa → compliant (WCAG AA hedefi için)
 */
export function isWCAGCompliant(report: A11yReport): boolean {
  return report.bySeverity.critical === 0 && report.bySeverity.serious === 0;
}