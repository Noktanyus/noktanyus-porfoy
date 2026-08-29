/**
 * @file Report Exporter
 * @description G3: Report sonuçlarını CSV ve JSON formatına çevirir.
 *              Pure functions — DB erişimi yok.
 */

import type { ReportResult, ReportRow } from "./schemas";

/**
 * CSV escape — virgül, tırnak, newline içeren değerleri doğru formatlar.
 */
function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  // Tırnak veya virgül veya newline varsa quote ile sar
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Report satırlarını CSV string'e çevirir.
 */
export function toCSV(result: ReportResult): string {
  if (result.rows.length === 0) return "";

  const firstRow = result.rows[0];
  const headers = Object.keys(firstRow);

  const lines: string[] = [];
  lines.push(headers.map(csvEscape).join(","));

  for (const row of result.rows) {
    lines.push(
      headers.map((h) => csvEscape(row[h])).join(",")
    );
  }

  return lines.join("\n");
}

/**
 * Report'u JSON string'e çevirir (indented).
 */
export function toJSON(result: ReportResult, pretty = true): string {
  return JSON.stringify(
    {
      config: result.config,
      rows: result.rows,
      totalRows: result.totalRows,
      generatedAt: result.generatedAt.toISOString(),
      executionTimeMs: result.executionTimeMs,
    },
    null,
    pretty ? 2 : 0
  );
}

/**
 * CSV içerik tipine göre MIME type.
 */
export function csvMimeType(): string {
  return "text/csv;charset=utf-8";
}

export function jsonMimeType(): string {
  return "application/json;charset=utf-8";
}

/**
 * Verilen format string'inden MIME type ve dosya uzantısı döner.
 */
export function exportFormatInfo(format: string): {
  mimeType: string;
  extension: string;
} {
  switch (format.toLowerCase()) {
    case "csv":
      return { mimeType: csvMimeType(), extension: "csv" };
    case "json":
      return { mimeType: jsonMimeType(), extension: "json" };
    default:
      return { mimeType: "text/plain;charset=utf-8", extension: "txt" };
  }
}

/**
 * Dosya adı üret — report adı + tarih.
 * Türkçe karakterler ASCII eşdeğerine çevrilir (ş→s, ı→i, ğ→g, vb.).
 */
export function generateFilename(reportName: string, format: string): string {
  // Türkçe karakterleri ASCII eşdeğerlerine çevir
  const turkishMap: Record<string, string> = {
    ş: "s", Ş: "s",
    ı: "i", İ: "i",
    ğ: "g", Ğ: "g",
    ü: "u", Ü: "u",
    ö: "o", Ö: "o",
    ç: "c", Ç: "c",
  };
  const asciiName = reportName.replace(/[şŞıİğĞüÜöÖçÇ]/g, (c) => turkishMap[c] ?? c);
  const safeName = asciiName
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
  const dateStr = new Date().toISOString().slice(0, 10);
  return `${safeName}-${dateStr}.${format}`;
}

/**
 * Satır sayısı istatistikleri.
 */
export interface ReportStats {
  rowCount: number;
  columnCount: number;
  /** Numeric sütunların toplamı */
  numericSums: Record<string, number>;
  /** Numeric sütunların ortalaması */
  numericAvgs: Record<string, number>;
}

export function computeStats(rows: ReportRow[]): ReportStats {
  if (rows.length === 0) {
    return { rowCount: 0, columnCount: 0, numericSums: {}, numericAvgs: {} };
  }

  const firstRow = rows[0];
  const columns = Object.keys(firstRow);
  const columnCount = columns.length;

  // Numeric column'ları tespit et (ilk satırdaki değerlerin tipine bak)
  const numericColumns: string[] = [];
  for (const col of columns) {
    const val = firstRow[col];
    if (typeof val === "number" && !isNaN(val)) {
      numericColumns.push(col);
    }
  }

  const numericSums: Record<string, number> = {};
  const numericAvgs: Record<string, number> = {};
  for (const col of numericColumns) {
    let sum = 0;
    let count = 0;
    for (const row of rows) {
      const v = row[col];
      if (typeof v === "number" && !isNaN(v)) {
        sum += v;
        count++;
      }
    }
    numericSums[col] = sum;
    numericAvgs[col] = count > 0 ? sum / count : 0;
  }

  return {
    rowCount: rows.length,
    columnCount,
    numericSums,
    numericAvgs,
  };
}