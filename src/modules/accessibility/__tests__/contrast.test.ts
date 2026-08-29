/**
 * @file Accessibility module tests
 * @description F2: WCAG contrast + audit kuralları testleri.
 */

import { describe, it, expect } from "vitest";
import {
  hexToRgb,
  rgbToHex,
  relativeLuminance,
  contrastRatio,
  checkContrast,
  passesWCAG,
  suggestAccessibleColor,
} from "../contrast";
import { runA11yAudit, isWCAGCompliant, filterBySeverity } from "../audit";

describe("WCAG Contrast", () => {
  it("hexToRgb 6-char hex'i parse eder", () => {
    expect(hexToRgb("#ffffff")).toEqual([255, 255, 255]);
    expect(hexToRgb("#000000")).toEqual([0, 0, 0]);
    expect(hexToRgb("#ff0000")).toEqual([255, 0, 0]);
  });

  it("hexToRgb 3-char shorthand'i parse eder", () => {
    expect(hexToRgb("#fff")).toEqual([255, 255, 255]);
    expect(hexToRgb("#abc")).toEqual([170, 187, 204]);
  });

  it("hexToRgb '#' olmadan da calisir", () => {
    expect(hexToRgb("ff00ff")).toEqual([255, 0, 255]);
  });

  it("hexToRgb gecersiz icin null doner", () => {
    expect(hexToRgb("not-a-color")).toBeNull();
    expect(hexToRgb("#xyz")).toBeNull();
    expect(hexToRgb("")).toBeNull();
  });

  it("rgbToHex dogru formatta hex uretir", () => {
    expect(rgbToHex([255, 255, 255])).toBe("#ffffff");
    expect(rgbToHex([0, 0, 0])).toBe("#000000");
  });

  it("relativeLuminance beyaz=1, siyah=0", () => {
    expect(relativeLuminance([255, 255, 255])).toBeCloseTo(1, 2);
    expect(relativeLuminance([0, 0, 0])).toBeCloseTo(0, 2);
  });

  it("contrastRatio siyah/beyaz = 21:1", () => {
    expect(contrastRatio([0, 0, 0], [255, 255, 255])).toBeCloseTo(21, 0);
  });

  it("contrastRatio ayni renk = 1:1", () => {
    expect(contrastRatio([128, 128, 128], [128, 128, 128])).toBeCloseTo(1, 0);
  });

  it("checkContrast AA seviyesi dogru tespit edilir", () => {
    // Siyah/beyaz = 21:1 → AAA
    expect(checkContrast("#000000", "#ffffff")?.level).toBe("AAA");
  });

  it("checkContrast dusuk kontrast 'fail' doner", () => {
    // Ayni renk
    expect(checkContrast("#777777", "#888888")?.level).toBe("fail");
  });

  it("checkContrast gecersiz icin null doner", () => {
    expect(checkContrast("invalid", "#ffffff")).toBeNull();
  });

  it("passesWCAG normal vs large text farkli threshold kullanir", () => {
    // 4:1 ratio - normal text fail, large text pass
    const result = passesWCAG(4, 16, false);
    expect(result.AA).toBe(false);
    expect(result.AAA).toBe(false);

    const result2 = passesWCAG(4, 24, false);
    expect(result2.AA).toBe(true);
  });

  it("passesWCAG bold 18.66px+ large sayilir", () => {
    expect(passesWCAG(3.5, 18, true).AA).toBe(true); // bold large
    expect(passesWCAG(3.5, 18, false).AA).toBe(false); // regular small
  });

  it("suggestAccessibleColor yeterli kontrast varsa orijinali doner", () => {
    const result = suggestAccessibleColor("#000000", "#ffffff", 4.5);
    expect(result).toBe("#000000");
  });

  it("suggestAccessibleColor dusuk kontrast icin duzeltme onerisi verir", () => {
    // Gri uzerine acik gri → erisilebilir degil
    const result = suggestAccessibleColor("#888888", "#aaaaaa", 4.5);
    expect(result).not.toBeNull();
    // Sonuc kontrasti >= 4.5 olmali
    if (result) {
      const check = checkContrast(result, "#aaaaaa");
      expect(check?.ratio ?? 0).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe("A11y Audit", () => {
  // Her test'ten önce document.documentElement lang'ini set et ki
  // html-lang kurali false-positive uretmesin.
  function setupDOM(html: string) {
    document.documentElement.setAttribute("lang", "tr");
    document.body.innerHTML = html;
  }

  it("temiz DOM'da 0 issue uretir", () => {
    setupDOM(`
      <h1>Sayfa</h1>
      <img src="x.jpg" alt="Resim" />
      <button>Buton</button>
      <a href="/foo">Link</a>
    `);
    const report = runA11yAudit(document);
    expect(report.score).toBeGreaterThanOrEqual(95);
    expect(isWCAGCompliant(report)).toBe(true);
  });

  it("img-alt eksikligi critical olarak yakalanir", () => {
    setupDOM(`<img src="x.jpg" />`);
    const report = runA11yAudit(document);
    const imgIssues = report.issues.filter((i) => i.rule === "img-alt");
    expect(imgIssues.length).toBeGreaterThan(0);
    expect(imgIssues[0].severity).toBe("critical");
  });

  it("button-name eksikligi yakalanir", () => {
    setupDOM(`<button></button>`);
    const report = runA11yAudit(document);
    expect(report.issues.some((i) => i.rule === "button-name")).toBe(true);
  });

  it("link-name eksikligi yakalanir", () => {
    setupDOM(`<a href="/foo"></a>`);
    const report = runA11yAudit(document);
    expect(report.issues.some((i) => i.rule === "link-name")).toBe(true);
  });

  it("heading-order hatasi yakalanir", () => {
    setupDOM(`<h1>A</h1><h3>Skip h2</h3>`);
    const report = runA11yAudit(document);
    expect(report.issues.some((i) => i.rule === "heading-order")).toBe(true);
  });

  it("html-lang eksikligi yakalanir", () => {
    document.documentElement.removeAttribute("lang");
    document.body.innerHTML = `<div></div>`;
    const report = runA11yAudit(document);
    expect(report.issues.some((i) => i.rule === "html-lang")).toBe(true);
  });

  it("label-input eksikligi yakalanir", () => {
    setupDOM(`<input type="text" />`);
    const report = runA11yAudit(document);
    expect(report.issues.some((i) => i.rule === "label-input")).toBe(true);
  });

  it("duplicate-id yakalanir", () => {
    setupDOM(`<div id="x"></div><div id="x"></div>`);
    const report = runA11yAudit(document);
    expect(report.issues.some((i) => i.rule === "duplicate-id")).toBe(true);
  });

  it("score 0-100 arasinda olur", () => {
    setupDOM(`<img src="x.jpg" /><button></button><a href="/y"></a>`);
    const report = runA11yAudit(document);
    expect(report.score).toBeGreaterThanOrEqual(0);
    expect(report.score).toBeLessThanOrEqual(100);
  });

  it("filterBySeverity sadece istenen seviyeyi getirir", () => {
    setupDOM(`<img src="x.jpg" /><h1></h1><h5></h5>`);
    const report = runA11yAudit(document);
    const criticalOnly = filterBySeverity(report, "critical");
    expect(criticalOnly.every((i) => i.severity === "critical")).toBe(true);
  });

  it("isWCAGCompliant critical/serious yoksa true doner", () => {
    setupDOM(`<h1></h1><h5></h5>`); // sadece moderate
    const report = runA11yAudit(document);
    expect(isWCAGCompliant(report)).toBe(true);
  });

  it("isWCAGCompliant critical varsa false doner", () => {
    setupDOM(`<img src="x.jpg" />`);
    const report = runA11yAudit(document);
    expect(isWCAGCompliant(report)).toBe(false);
  });
});