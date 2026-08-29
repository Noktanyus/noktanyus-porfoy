/**
 * @file Report builder tests
 * @description G3: validation, CSV export, JSON export, stats testleri.
 */

import { describe, it, expect } from "vitest";
import {
  validateReportConfig,
  SOURCE_FIELDS,
  SOURCE_METRIC_FUNCTIONS,
  VALID_OPERATORS,
  type ReportConfig,
  type ReportResult,
  type ReportRow,
} from "../schemas";
import {
  toCSV,
  toJSON,
  exportFormatInfo,
  generateFilename,
  computeStats,
  csvMimeType,
  jsonMimeType,
} from "../exporter";

const validConfig: ReportConfig = {
  name: "Sipariş Raporu",
  source: "orders",
  metrics: [{ field: "totalAmount", function: "sum" }],
  dimensions: ["status"],
  filters: [{ field: "status", operator: "eq", value: "paid" }],
  limit: 100,
};

describe("Report Builder - Validation", () => {
  it("valid config hatasiz gecer", () => {
    const r = validateReportConfig(validConfig);
    expect(r.valid).toBe(true);
    expect(r.errors).toHaveLength(0);
  });

  it("name bossa hata verir", () => {
    const r = validateReportConfig({ ...validConfig, name: "" });
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.includes("name"))).toBe(true);
  });

  it("name >200 karakter hata verir", () => {
    const r = validateReportConfig({ ...validConfig, name: "x".repeat(201) });
    expect(r.valid).toBe(false);
  });

  it("gecersiz source hata verir", () => {
    const r = validateReportConfig({ ...validConfig, source: "drop_table" as any });
    expect(r.valid).toBe(false);
  });

  it("metric field whitelist kontrolu", () => {
    const r = validateReportConfig({
      ...validConfig,
      metrics: [{ field: "evil_field", function: "sum" }],
    });
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.includes("field gecersiz"))).toBe(true);
  });

  it("metric function source'a gore kontrol edilir", () => {
    // users source'unda sum yok
    const r = validateReportConfig({
      ...validConfig,
      source: "users",
      metrics: [{ field: "id", function: "sum" }],
    });
    expect(r.valid).toBe(false);
  });

  it("filter field whitelist kontrolu", () => {
    const r = validateReportConfig({
      ...validConfig,
      filters: [{ field: "sql_injection_field", operator: "eq", value: "x" }],
    });
    expect(r.valid).toBe(false);
  });

  it("filter operator whitelist kontrolu", () => {
    const r = validateReportConfig({
      ...validConfig,
      filters: [{ field: "status", operator: "drop_table" as any, value: "x" }],
    });
    expect(r.valid).toBe(false);
  });

  it("dimension whitelist kontrolu", () => {
    const r = validateReportConfig({
      ...validConfig,
      dimensions: ["evil_dim"],
    });
    expect(r.valid).toBe(false);
  });

  it("limit 0 hata verir", () => {
    const r = validateReportConfig({ ...validConfig, limit: 0 });
    expect(r.valid).toBe(false);
  });

  it("limit >10000 hata verir", () => {
    const r = validateReportConfig({ ...validConfig, limit: 99999 });
    expect(r.valid).toBe(false);
  });

  it("limit 1-10000 arasinda gecerli", () => {
    expect(validateReportConfig({ ...validConfig, limit: 1 }).valid).toBe(true);
    expect(validateReportConfig({ ...validConfig, limit: 10000 }).valid).toBe(true);
  });

  it("0 metric hata verir", () => {
    const r = validateReportConfig({ ...validConfig, metrics: [] });
    expect(r.valid).toBe(false);
  });

  it("tum source'lar icin alan tanimli", () => {
    const sources = ["users", "orders", "subscriptions", "products", "customers", "messages"] as const;
    sources.forEach((s) => {
      expect(SOURCE_FIELDS[s]).toBeDefined();
      expect(SOURCE_METRIC_FUNCTIONS[s]).toBeDefined();
    });
  });

  it("VALID_OPERATORS 11 operator icerir", () => {
    expect(VALID_OPERATORS.length).toBe(11);
  });
});

const sampleResult: ReportResult = {
  config: validConfig,
  rows: [
    { status: "paid", totalAmount: 100, count: 5 },
    { status: "pending", totalAmount: 50, count: 3 },
    { status: "refunded", totalAmount: 20, count: 1 },
  ],
  totalRows: 3,
  generatedAt: new Date("2024-01-01T00:00:00Z"),
  executionTimeMs: 42,
};

describe("Report Exporter", () => {
  it("toCSV header + satirlar uretir", () => {
    const csv = toCSV(sampleResult);
    const lines = csv.split("\n");
    expect(lines).toHaveLength(4); // 1 header + 3 rows
    expect(lines[0]).toContain("status");
    expect(lines[0]).toContain("totalAmount");
    expect(lines[0]).toContain("count");
  });

  it("toCSV virgul iceren deger quote ile sarilir", () => {
    const result = {
      ...sampleResult,
      rows: [{ status: "with,comma", totalAmount: 100, count: 1 }],
    };
    const csv = toCSV(result);
    expect(csv).toContain('"with,comma"');
  });

  it("toCSV null degerleri bos string yapar", () => {
    const result = {
      ...sampleResult,
      rows: [{ status: null, totalAmount: 100, count: 1 }],
    };
    const csv = toCSV(result);
    expect(csv).toContain(",100,"); // null → ""
  });

  it("toCSV bos rows sadece header doner", () => {
    const csv = toCSV({ ...sampleResult, rows: [] });
    expect(csv).toBe("");
  });

  it("toJSON config ve rows içerir", () => {
    const json = toJSON(sampleResult);
    const parsed = JSON.parse(json);
    expect(parsed.config.name).toBe("Sipariş Raporu");
    expect(parsed.rows).toHaveLength(3);
    expect(parsed.executionTimeMs).toBe(42);
  });

  it("toJSON pretty olmadan compact doner", () => {
    const json = toJSON(sampleResult, false);
    expect(json).not.toContain("\n  ");
  });

  it("exportFormatInfo CSV mimeType doner", () => {
    const info = exportFormatInfo("csv");
    expect(info.mimeType).toBe(csvMimeType());
    expect(info.extension).toBe("csv");
  });

  it("exportFormatInfo JSON mimeType doner", () => {
    const info = exportFormatInfo("json");
    expect(info.mimeType).toBe(jsonMimeType());
    expect(info.extension).toBe("json");
  });

  it("exportFormatInfo bilinmeyen format fallback", () => {
    const info = exportFormatInfo("xml");
    expect(info.extension).toBe("txt");
  });

  it("generateFilename safe name + tarih", () => {
    const name = generateFilename("Sipariş Raporu!", "csv");
    expect(name).toMatch(/^siparis-raporu-\d{4}-\d{2}-\d{2}\.csv$/);
  });

  it("generateFilename Turkce karakterleri temizler", () => {
    const name = generateFilename("Ödeme & İade Raporu", "json");
    expect(name).not.toMatch(/[ğüşıöçĞÜŞİÖÇ]/i);
    expect(name).toMatch(/\.json$/);
  });

  it("generateFilename 50 karakter limiti", () => {
    const name = generateFilename("x".repeat(100), "csv");
    const baseName = name.replace(/-\d{4}-\d{2}-\d{2}\.csv$/, "");
    expect(baseName.length).toBeLessThanOrEqual(50);
  });
});

describe("Report Stats", () => {
  it("bos rows 0/0 doner", () => {
    const stats = computeStats([]);
    expect(stats.rowCount).toBe(0);
    expect(stats.columnCount).toBe(0);
    expect(Object.keys(stats.numericSums)).toHaveLength(0);
  });

  it("numericSums dogru hesaplanir", () => {
    const stats = computeStats(sampleResult.rows);
    expect(stats.numericSums.totalAmount).toBe(170);
    expect(stats.numericSums.count).toBe(9);
  });

  it("numericAvgs dogru hesaplanir", () => {
    const stats = computeStats(sampleResult.rows);
    expect(stats.numericAvgs.totalAmount).toBeCloseTo(56.67, 1);
    expect(stats.numericAvgs.count).toBe(3);
  });

  it("non-numeric sutunlar yoksayilir", () => {
    const rows: ReportRow[] = [
      { name: "Alice", age: 30 },
      { name: "Bob", age: 25 },
    ];
    const stats = computeStats(rows);
    expect(stats.numericSums.age).toBe(55);
    expect(stats.numericSums.name).toBeUndefined();
  });

  it("rowCount ve columnCount", () => {
    const stats = computeStats(sampleResult.rows);
    expect(stats.rowCount).toBe(3);
    expect(stats.columnCount).toBe(3);
  });
});