'use client';

/**
 * @file BulkUploadDropzone — CSV dosyası drag-drop alanı + önizleme.
 * @description Maks 5MB ve yalnızca .csv uzantısı kabul edilir. Dosya seçildiğinde
 *              ilk 5 satırı tablo halinde önizler. Üst componente dosya + metadata
 *              onSubmit üzerinden aktarılır.
 *
 *              Server-side doğrulama /api/saas/ai/describe/bulk içinde yapılır;
 *              bu sadece UX katmanı.
 */

import { useCallback, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface PreviewRow {
  [key: string]: string;
}

interface BulkUploadDropzoneProps {
  /** Üst componente gönderilecek handler — file + parsed preview satırları. */
  onFileAccepted: (payload: {
    file: File;
    preview: PreviewRow[];
    headers: string[];
    rowCount: number;
  }) => void;
  /** Submit sırasında UI busy state. */
  busy?: boolean;
}

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_PREVIEW_ROWS = 5;

export function BulkUploadDropzone({ onFileAccepted, busy }: BulkUploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{
    headers: string[];
    rows: PreviewRow[];
    rowCount: number;
    fileName: string;
  } | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);

      if (!file.name.toLowerCase().endsWith('.csv')) {
        setError('Yalnızca .csv dosyaları kabul edilir');
        return;
      }
      if (file.size > MAX_BYTES) {
        setError('Dosya boyutu 5MB sınırını aşıyor');
        return;
      }

      const text = await file.text();
      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length < 2) {
        setError('CSV en az 1 başlık satırı + 1 veri satırı içermeli');
        return;
      }

      const parseLine = (line: string): string[] => {
        // Basit CSV parser — tırnak içi virgül desteği
        const out: string[] = [];
        let cur = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const ch = line[i];
          if (inQuotes) {
            if (ch === '"' && line[i + 1] === '"') {
              cur += '"';
              i++;
            } else if (ch === '"') {
              inQuotes = false;
            } else {
              cur += ch;
            }
          } else if (ch === '"') {
            inQuotes = true;
          } else if (ch === ',') {
            out.push(cur);
            cur = '';
          } else {
            cur += ch;
          }
        }
        out.push(cur);
        return out;
      };

      const headers = parseLine(lines[0]).map((h) => h.trim());
      const dataLines = lines.slice(1);
      const rows: PreviewRow[] = dataLines.slice(0, MAX_PREVIEW_ROWS).map((line) => {
        const cells = parseLine(line);
        const obj: PreviewRow = {};
        headers.forEach((h, i) => {
          obj[h] = cells[i] ?? '';
        });
        return obj;
      });

      setPreview({ headers, rows, rowCount: dataLines.length, fileName: file.name });
      onFileAccepted({ file, preview: rows, headers, rowCount: dataLines.length });
    },
    [onFileAccepted]
  );

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  }

  function onSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
  }

  function reset() {
    setPreview(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="CSV dosyası yükle"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
        }}
        className={cn(
          'rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary',
          dragActive
            ? 'border-brand-primary bg-brand-primary/5'
            : 'border-gray-300 dark:border-gray-700 hover:border-brand-primary/60 hover:bg-gray-50 dark:hover:bg-gray-900',
          busy && 'pointer-events-none opacity-60'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={onSelect}
          className="sr-only"
          disabled={busy}
        />
        <p className="text-4xl mb-3" aria-hidden="true">📄</p>
        <p className="font-semibold text-gray-900 dark:text-white">
          CSV dosyanızı sürükleyin veya seçin
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Maks 5MB · UTF-8 · ilk satır başlık olmalı (title, features, ...)
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 px-4 py-3 text-sm text-red-700 dark:text-red-300"
        >
          {error}
        </div>
      )}

      {preview && (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <div>
              <p className="font-semibold text-sm text-gray-900 dark:text-white">{preview.fileName}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {preview.rowCount} satır · ilk {preview.rows.length} önizleniyor
              </p>
            </div>
            <button
              type="button"
              onClick={reset}
              disabled={busy}
              className="text-xs text-gray-500 hover:text-red-600 underline underline-offset-2"
            >
              Kaldır
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-gray-600 dark:text-gray-400">
                <tr>
                  {preview.headers.map((h) => (
                    <th key={h} scope="col" className="px-3 py-2 text-left whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((row, i) => (
                  <tr key={i} className="border-t border-gray-100 dark:border-gray-800">
                    {preview.headers.map((h) => (
                      <td key={h} className="px-3 py-2 text-gray-700 dark:text-gray-300 max-w-[200px] truncate" title={row[h]}>
                        {row[h] || <span className="text-gray-400">—</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
