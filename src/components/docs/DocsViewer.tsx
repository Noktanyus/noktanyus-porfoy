'use client';

/**
 * @file DocsViewer — Dokümantasyon Görüntüleyici (İnteraktif Gezgin + Redoc)
 */

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { FaBolt, FaBook } from 'react-icons/fa';
import { ApiExplorer } from './ApiExplorer';

const RedocMount = dynamic(() => import('./RedocMount'), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[400px] items-center justify-center rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
        <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-blue-500" />
        Redoc API referansı yükleniyor…
      </div>
    </div>
  ),
});

export function DocsViewer() {
  const [activeView, setActiveView] = useState<'explorer' | 'redoc'>('explorer');

  return (
    <div className="space-y-6">
      {/* Görünüm Seçici Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-800">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Endpoint Referansı &amp; Kullanım Kılavuzu
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Tüm Türkiye yardımcı API servisleri: atılacak istek formatları, beklenen dönüş verileri ve hata kodları.
          </p>
        </div>

        <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-1 dark:border-slate-800 dark:bg-slate-900">
          <button
            type="button"
            onClick={() => setActiveView('explorer')}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition ${
              activeView === 'explorer'
                ? 'bg-white text-indigo-700 shadow-sm dark:bg-slate-800 dark:text-indigo-300'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <FaBolt className="text-amber-500" />
            <span>İnteraktif Gezgin &amp; İstek/Yanıtlar</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveView('redoc')}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition ${
              activeView === 'redoc'
                ? 'bg-white text-indigo-700 shadow-sm dark:bg-slate-800 dark:text-indigo-300'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <FaBook className="text-indigo-500" />
            <span>Redoc 3 Sütun Görünümü</span>
          </button>
        </div>
      </div>

      {/* Aktif Görünüm */}
      {activeView === 'explorer' ? (
        <ApiExplorer />
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
            <span>Spec: OpenAPI 3.1.0 · Yerel Redoc motoru</span>
            <button
              type="button"
              onClick={() => setActiveView('explorer')}
              className="text-indigo-600 hover:underline dark:text-indigo-400"
            >
              ← Hızlı Gezgin Görünümüne Dön
            </button>
          </div>
          <RedocMount />
        </div>
      )}
    </div>
  );
}

export default DocsViewer;
