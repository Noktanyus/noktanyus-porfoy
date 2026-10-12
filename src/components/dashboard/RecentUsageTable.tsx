'use client';

import React, { useState, useMemo } from 'react';
import { formatLatencyMs } from '@/lib/usageLatency';

export interface RecentUsageItem {
  id: string;
  endpoint: string;
  method: string;
  statusCode: number;
  durationMs: number | null;
  timestamp: string | Date;
  apiKeyId: string;
  keyName: string | null;
}

interface RecentUsageTableProps {
  items: RecentUsageItem[];
}

function statusTone(code: number): string {
  if (code >= 200 && code < 400) return 'text-emerald-700 bg-emerald-500/10 dark:text-emerald-300';
  if (code === 429 || code === 402) return 'text-amber-700 bg-amber-500/10 dark:text-amber-300';
  return 'text-rose-700 bg-rose-500/10 dark:text-rose-300';
}

export function RecentUsageTable({ items }: RecentUsageTableProps) {
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [filterText, setFilterText] = useState<string>('');

  const filteredItems = useMemo(() => {
    if (!filterText.trim()) return items;
    const q = filterText.toLowerCase().trim();
    return items.filter(
      (item) =>
        item.endpoint.toLowerCase().includes(q) ||
        item.method.toLowerCase().includes(q) ||
        String(item.statusCode).includes(q) ||
        (item.keyName && item.keyName.toLowerCase().includes(q))
    );
  }, [items, filterText]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, safePage, pageSize]);

  const startIndex = (safePage - 1) * pageSize + 1;
  const endIndex = Math.min(safePage * pageSize, filteredItems.length);

  return (
    <section className="rounded-2xl border border-border bg-card/50 p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-foreground">Son İstekler</h2>
          <p className="text-xs text-muted-foreground">
            {filteredItems.length === 0
              ? 'Kayıt bulunamadı'
              : `Toplam ${filteredItems.length} istek arasından ${startIndex}-${endIndex} gösteriliyor`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            placeholder="Filtrele (endpoint, kod)..."
            value={filterText}
            onChange={(e) => {
              setFilterText(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1 text-xs rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-brand-primary"
          />

          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-2 py-1 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-brand-primary cursor-pointer"
            aria-label="Sayfa başına kayıt sayısı"
          >
            <option value={10}>10 / sayfa</option>
            <option value={25}>25 / sayfa</option>
            <option value={50}>50 / sayfa</option>
          </select>
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4">Kayıt bulunamadı.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground border-b border-border">
                <th className="py-2 pr-3 font-semibold">Zaman</th>
                <th className="py-2 pr-3 font-semibold">Metod</th>
                <th className="py-2 pr-3 font-semibold">Endpoint</th>
                <th className="py-2 pr-3 font-semibold">Durum</th>
                <th className="py-2 pr-3 font-semibold">Süre</th>
                <th className="py-2 font-semibold">Anahtar</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map((r) => {
                const dateObj = typeof r.timestamp === 'string' ? new Date(r.timestamp) : r.timestamp;
                const formattedTime = dateObj instanceof Date && !isNaN(dateObj.getTime())
                  ? dateObj.toLocaleString('tr-TR')
                  : String(r.timestamp);

                return (
                  <tr key={r.id} className="border-b border-border/60 hover:bg-muted/30 transition-colors">
                    <td className="py-2.5 pr-3 whitespace-nowrap text-muted-foreground text-xs">
                      {formattedTime}
                    </td>
                    <td className="py-2.5 pr-3 font-mono text-xs font-semibold">
                      <span className="px-1.5 py-0.5 rounded bg-muted text-foreground">
                        {r.method}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3 font-mono text-xs max-w-[220px] truncate" title={r.endpoint}>
                      {r.endpoint}
                    </td>
                    <td className="py-2.5 pr-3 font-semibold tabular-nums">
                      <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-bold ${statusTone(r.statusCode)}`}>
                        {r.statusCode}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3 tabular-nums text-muted-foreground text-xs">
                      {formatLatencyMs(r.durationMs)}
                    </td>
                    <td className="py-2.5 text-muted-foreground text-xs">{r.keyName ?? '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-3 border-t border-border/70 text-xs text-muted-foreground">
          <span>
            Sayfa <span className="font-semibold text-foreground">{safePage}</span> / {totalPages}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              className="px-2.5 py-1 rounded-lg border border-border bg-background disabled:opacity-40 disabled:cursor-not-allowed hover:bg-muted transition-colors font-medium text-foreground"
            >
              ← Önceki
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              className="px-2.5 py-1 rounded-lg border border-border bg-background disabled:opacity-40 disabled:cursor-not-allowed hover:bg-muted transition-colors font-medium text-foreground"
            >
              Sonraki →
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
