'use client';

/**
 * @file CodeSampleTabs — dil sekmeli, kopyalanabilir kod örneği kartı
 * @description /docs hızlı başlangıç bölümünde kullanılır. Canlı istek
 *              ATMAZ — kullanıcının API anahtarını tarayıcıya girmesini
 *              gerektiren bir playground yerine kopyala-yapıştır snippet
 *              sunar (anahtar sızma yüzeyi yok).
 *
 *              Yeni dependency gerektirmez: sekmeler + clipboard native.
 */

import { useState } from 'react';

export interface CodeSample {
  /** Sekme kimliği — ör. 'curl' */
  id: string;
  /** Sekme etiketi — ör. 'cURL' */
  label: string;
  code: string;
}

interface CodeSampleTabsProps {
  /** Kart başlığı — ör. 'IBAN doğrulama' */
  title: string;
  /** Endpoint imzası — ör. 'POST /api/v1/validate/iban' */
  endpoint: string;
  samples: CodeSample[];
  /** Başarılı yanıt gövdesi (opsiyonel, JSON string) */
  response?: string;
}

export default function CodeSampleTabs({
  title,
  endpoint,
  samples,
  response,
}: CodeSampleTabsProps) {
  const [activeId, setActiveId] = useState(samples[0]?.id ?? '');
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');

  const active = samples.find((s) => s.id === activeId) ?? samples[0];
  const tabsId = `code-${endpoint.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`;

  const handleCopy = async () => {
    if (!active) return;
    try {
      await navigator.clipboard.writeText(active.code);
      setCopyState('copied');
    } catch {
      setCopyState('failed');
    }
    setTimeout(() => setCopyState('idle'), 2000);
  };

  if (!active) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-slate-900 dark:text-slate-50">
            {title}
          </h3>
          <code className="text-xs text-slate-500 dark:text-slate-400">{endpoint}</code>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:border-blue-500 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-blue-400 dark:hover:text-blue-300"
        >
          {copyState === 'copied'
            ? 'Kopyalandı'
            : copyState === 'failed'
              ? 'Kopyalanamadı'
              : 'Kopyala'}
        </button>
      </div>

      <div
        role="tablist"
        aria-label={`${title} kod örneği dilleri`}
        className="flex gap-1 border-b border-slate-200 px-2 pt-2 dark:border-slate-800"
      >
        {samples.map((sample) => {
          const selected = sample.id === active.id;
          return (
            <button
              key={sample.id}
              type="button"
              role="tab"
              id={`${tabsId}-tab-${sample.id}`}
              aria-selected={selected}
              aria-controls={`${tabsId}-panel-${sample.id}`}
              onClick={() => {
                setActiveId(sample.id);
                setCopyState('idle');
              }}
              className={`rounded-t-md px-3 py-1.5 text-xs font-medium transition ${
                selected
                  ? 'bg-slate-900 text-white dark:bg-slate-800'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
              }`}
            >
              {sample.label}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`${tabsId}-panel-${active.id}`}
        aria-labelledby={`${tabsId}-tab-${active.id}`}
      >
        <pre className="overflow-x-auto p-4 text-xs leading-relaxed text-slate-800 dark:text-slate-200">
          <code>{active.code}</code>
        </pre>
      </div>

      {response ? (
        <div className="border-t border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/60">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            200 yanıtı
          </p>
          <pre className="mt-1 overflow-x-auto text-xs leading-relaxed text-slate-700 dark:text-slate-300">
            <code>{response}</code>
          </pre>
        </div>
      ) : null}
    </div>
  );
}
