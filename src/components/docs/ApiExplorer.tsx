'use client';

/**
 * @file ApiExplorer — Yerel İnteraktif API Gezgini & İstek/Yanıt Referansı
 * @description Harici CDN veya kütüphane bağımlılığı olmaksızın, OpenAPI 3.1.0 şemasını
 *              ayrıştırarak tüm endpoint'leri, atılacak istek formatlarını, 200 başarılı yanıtları,
 *              400/401/402/429 hata yanıtlarını ve cURL/JS/Python kod örneklerini gösterir.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  FaSearch,
  FaCopy,
  FaCheck,
  FaChevronDown,
  FaChevronUp,
  FaShieldAlt,
  FaCode,
  FaExclamationTriangle,
  FaCheckCircle,
} from 'react-icons/fa';

interface PropertyDetail {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

interface EndpointData {
  path: string;
  method: 'POST' | 'GET';
  summary: string;
  description: string;
  category: string;
  tags: string[];
  requestProperties: PropertyDetail[];
  requestExample: unknown;
  responseExample: unknown;
  responseProperties: PropertyDetail[];
  errorExamples: Record<string, { title: string; example: unknown }>;
  codeSamples: Array<{ lang: string; label: string; source: string }>;
}

const CATEGORIES = [
  'Tümü',
  'Doğrulama & Kimlik',
  'Finans & Vergi',
  'İş Hukuku & SGK',
  'Fatura & e-Dönüşüm',
  'Takvim & Hukuk',
  'Kargo & Lojistik',
  'E-Ticaret & Gümrük',
  'Coğrafya & Araçlar',
];

function categorizePath(path: string): string {
  if (path.includes('/validate/') || path.includes('/iban')) return 'Doğrulama & Kimlik';
  if (path.includes('/finance/') || path.includes('/tax/')) return 'Finans & Vergi';
  if (path.includes('/labor/')) return 'İş Hukuku & SGK';
  if (path.includes('/invoice/')) return 'Fatura & e-Dönüşüm';
  if (path.includes('/calendar/') || path.includes('/legal/')) return 'Takvim & Hukuk';
  if (path.includes('/cargo/') || path.includes('/shipping/')) return 'Kargo & Lojistik';
  if (path.includes('/commerce/')) return 'E-Ticaret & Gümrük';
  if (path.includes('/geo/') || path.includes('/parse/') || path.includes('/text/')) return 'Coğrafya & Araçlar';
  return 'Diğer';
}

export function ApiExplorer() {
  const [endpoints, setEndpoints] = useState<EndpointData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tümü');
  const [expandedEndpoints, setExpandedEndpoints] = useState<Record<string, boolean>>({});
  const [activeTabs, setActiveTabs] = useState<Record<string, 'request' | 'response' | 'errors' | 'code'>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const catParam = (urlParams.get('kategori') || urlParams.get('cat') || '').toLowerCase();
      if (catParam === 'labor' || catParam === 'is-hukuku' || catParam === 'is_hukuku') {
        setSelectedCategory('İş Hukuku & SGK');
      } else if (catParam === 'validate' || catParam === 'dogrulama') {
        setSelectedCategory('Doğrulama & Kimlik');
      } else if (catParam === 'finance' || catParam === 'finans') {
        setSelectedCategory('Finans & Vergi');
      } else if (catParam === 'invoice' || catParam === 'fatura') {
        setSelectedCategory('Fatura & e-Dönüşüm');
      } else if (catParam === 'calendar' || catParam === 'takvim') {
        setSelectedCategory('Takvim & Hukuk');
      } else if (catParam === 'cargo' || catParam === 'kargo') {
        setSelectedCategory('Kargo & Lojistik');
      } else if (catParam === 'commerce' || catParam === 'eticaret') {
        setSelectedCategory('E-Ticaret & Gümrük');
      } else if (catParam === 'geo' || catParam === 'cografya') {
        setSelectedCategory('Coğrafya & Araçlar');
      }
    }

    async function loadSpec() {
      try {
        const res = await fetch('/api/openapi');
        if (!res.ok) throw new Error('Spec alınamadı');
        const spec = await res.json();
        if (cancelled) return;

        const list: EndpointData[] = [];
        const paths = spec.paths || {};

        for (const [path, pathItem] of Object.entries<Record<string, unknown>>(paths)) {
          const method = (pathItem.post ? 'POST' : pathItem.get ? 'GET' : 'POST') as 'POST' | 'GET';
          const op = ((pathItem.post || pathItem.get) as Record<string, unknown>) || {};

          // Request Body
          const reqBody = op.requestBody as Record<string, unknown> | undefined;
          const reqJson = reqBody?.content
            ? ((reqBody.content as Record<string, unknown>)['application/json'] as Record<string, unknown>)
            : undefined;
          const reqSchema = reqJson?.schema as Record<string, unknown> | undefined;
          const reqExample = reqJson?.example || reqJson?.examples;

          const reqProps: PropertyDetail[] = [];
          if (reqSchema && reqSchema.properties) {
            const requiredList = Array.isArray(reqSchema.required) ? reqSchema.required : [];
            for (const [propName, propDef] of Object.entries(
              reqSchema.properties as Record<string, Record<string, unknown>>
            )) {
              reqProps.push({
                name: propName,
                type: String(propDef?.type || 'string'),
                required: requiredList.includes(propName),
                description: String(propDef?.description || ''),
              });
            }
          }

          // Responses
          const responses = op.responses as Record<string, unknown> | undefined;
          const res200 = responses?.['200'] as Record<string, unknown> | undefined;
          const resJson = res200?.content
            ? ((res200.content as Record<string, unknown>)['application/json'] as Record<string, unknown>)
            : undefined;
          const resExample = resJson?.example;

          const resProps: PropertyDetail[] = [];
          const resSchema = resJson?.schema as Record<string, unknown> | undefined;
          if (resSchema && resSchema.properties) {
            for (const [propName, propDef] of Object.entries(
              resSchema.properties as Record<string, Record<string, unknown>>
            )) {
              resProps.push({
                name: propName,
                type: String(propDef?.type || 'object'),
                required: true,
                description: String(propDef?.description || ''),
              });
            }
          }

          // Standard Errors
          const errorExamples: Record<string, { title: string; example: unknown }> = {
            '400': {
              title: 'Doğrulama Hatası (Validation)',
              example: {
                success: false,
                error: {
                  code: 'VALIDATION',
                  message: 'Gerekli alanlar eksik veya format hatalı.',
                },
              },
            },
            '401': {
              title: 'Yetkilendirme Hatası (Unauthorized)',
              example: {
                success: false,
                error: {
                  code: 'UNAUTHORIZED',
                  message: 'x-api-key başlığı eksik veya geçersiz.',
                },
              },
            },
            '402': {
              title: 'Bakiye / Kota Yetersiz (Quota Exceeded)',
              example: {
                success: false,
                error: {
                  code: 'QUOTA_EXCEEDED',
                  message: 'Aylık kota doldu veya kredi bakiyesi yetersiz.',
                },
              },
            },
            '429': {
              title: 'Hız Limiti Aşıldı (Rate Limited)',
              example: {
                success: false,
                error: {
                  code: 'RATE_LIMITED',
                  message: 'Dakika başına istek limiti aşıldı. Lütfen bekleyin.',
                },
              },
            },
          };

          // Code Samples
          const codeSamples = (Array.isArray(op['x-codeSamples']) ? op['x-codeSamples'] : []) as Array<{
            lang: string;
            label: string;
            source: string;
          }>;

          list.push({
            path,
            method,
            summary: String(op.summary || path),
            description: String(op.description || ''),
            category: categorizePath(path),
            tags: Array.isArray(op.tags) ? (op.tags as string[]) : [],
            requestProperties: reqProps,
            requestExample: reqExample || (reqProps.length > 0 ? { [reqProps[0]?.name || 'field']: 'örnek_değer' } : {}),
            responseExample:
              resExample || {
                success: true,
                data: { sonuc: 'başarılı' },
              },
            responseProperties: resProps,
            errorExamples,
            codeSamples:
              codeSamples.length > 0
                ? codeSamples
                : [
                    {
                      lang: 'Shell',
                      label: 'cURL',
                      source: `curl -X POST "https://noktanyus.com${path}" \\\n  -H "x-api-key: YOUR_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '${JSON.stringify(reqExample || {})}'`,
                    },
                    {
                      lang: 'JavaScript',
                      label: 'Fetch',
                      source: `const res = await fetch("https://noktanyus.com${path}", {\n  method: "POST",\n  headers: {\n    "x-api-key": "YOUR_API_KEY",\n    "Content-Type": "application/json"\n  },\n  body: JSON.stringify(${JSON.stringify(reqExample || {}, null, 2)})\n});\nconst data = await res.json();\nconsole.log(data);`,
                    },
                    {
                      lang: 'Python',
                      label: 'Python',
                      source: `import requests\n\nres = requests.post(\n    "https://noktanyus.com${path}",\n    headers={"x-api-key": "YOUR_API_KEY"},\n    json=${JSON.stringify(reqExample || {})}\n)\nprint(res.json())`,
                    },
                  ],
          });
        }

        setEndpoints(list);
        if (list.length > 0) {
          // İlk endpoint'i varsayılan olarak açık göster
          setExpandedEndpoints({ [list[0].path]: true });
        }
      } catch (err) {
        console.error('API explorer error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadSpec();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredEndpoints = useMemo(() => {
    return endpoints.filter((ep) => {
      const matchesCategory = selectedCategory === 'Tümü' || ep.category === selectedCategory;
      if (!matchesCategory) return false;

      if (!search.trim()) return true;
      const q = search.toLowerCase().trim();
      return (
        ep.path.toLowerCase().includes(q) ||
        ep.summary.toLowerCase().includes(q) ||
        ep.description.toLowerCase().includes(q) ||
        ep.category.toLowerCase().includes(q)
      );
    });
  }, [endpoints, selectedCategory, search]);

  const toggleExpand = (path: string) => {
    setExpandedEndpoints((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  const setTab = (path: string, tab: 'request' | 'response' | 'errors' | 'code') => {
    setActiveTabs((prev) => ({ ...prev, [path]: tab }));
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // fallback
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[360px] flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
          API uç noktaları ve istek/yanıt şemaları yükleniyor…
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Arama & Kategori Filtresi */}
      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="relative">
          <FaSearch className="absolute left-4 top-3.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Endpoint adı, yol (/api/v1/...) veya anahtar kelime ara (örn: iban, kdv, kidem, kargo)..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-indigo-400"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3.5 top-2.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              Temizle
            </button>
          )}
        </div>

        {/* Kategori Butonları */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => {
            const count =
              cat === 'Tümü'
                ? endpoints.length
                : endpoints.filter((e) => e.category === cat).length;
            const isSelected = selectedCategory === cat;

            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
              >
                <span>{cat}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                    isSelected
                      ? 'bg-indigo-700/60 text-white'
                      : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
          <span>
            Toplam <strong>{filteredEndpoints.length}</strong> endpoint listeleniyor
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                const all: Record<string, boolean> = {};
                filteredEndpoints.forEach((e) => (all[e.path] = true));
                setExpandedEndpoints(all);
              }}
              className="text-indigo-600 hover:underline dark:text-indigo-400 font-medium"
            >
              Tümünü Genişlet
            </button>
            <span>·</span>
            <button
              type="button"
              onClick={() => setExpandedEndpoints({})}
              className="text-slate-500 hover:underline dark:text-slate-400 font-medium"
            >
              Tümünü Daralt
            </button>
          </div>
        </div>
      </div>

      {/* Endpoint Kartları Listesi */}
      <div className="space-y-4">
        {filteredEndpoints.map((ep) => {
          const isExpanded = Boolean(expandedEndpoints[ep.path]);
          const activeTab = activeTabs[ep.path] || 'request';

          return (
            <div
              key={ep.path}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
            >
              {/* Başlık / Tıklanabilir Bar */}
              <div
                onClick={() => toggleExpand(ep.path)}
                className="flex cursor-pointer flex-wrap items-center justify-between gap-3 p-4 sm:p-5 hover:bg-slate-50/50 dark:hover:bg-slate-800/40"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`rounded-md px-2.5 py-1 text-xs font-extrabold uppercase tracking-wide ${
                      ep.method === 'POST'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300'
                    }`}
                  >
                    {ep.method}
                  </span>
                  <code className="font-mono text-sm font-bold text-slate-900 dark:text-slate-100 sm:text-base">
                    {ep.path}
                  </code>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300 font-medium">
                    {ep.category}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 dark:text-slate-400 hidden md:inline">
                    {ep.summary}
                  </span>
                  <div className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                    {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                  </div>
                </div>
              </div>

              {/* Genişletilmiş Detay Gövdesi */}
              {isExpanded && (
                <div className="border-t border-slate-200 bg-slate-50/40 p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-950/50">
                  <p className="mb-4 text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                    {ep.description || ep.summary}
                  </p>

                  {/* Üst Sekmeler */}
                  <div className="mb-4 flex flex-wrap gap-2 border-b border-slate-200 pb-3 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setTab(ep.path, 'request')}
                      className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                        activeTab === 'request'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                      }`}
                    >
                      <FaShieldAlt className="text-xs" />
                      <span>İstek Formatı (Request)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTab(ep.path, 'response')}
                      className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                        activeTab === 'response'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                      }`}
                    >
                      <FaCheckCircle className="text-xs" />
                      <span>Başarılı Yanıt (200 OK)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTab(ep.path, 'errors')}
                      className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                        activeTab === 'errors'
                          ? 'bg-rose-600 text-white shadow-sm'
                          : 'bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                      }`}
                    >
                      <FaExclamationTriangle className="text-xs" />
                      <span>Olası Hata Yanıtları (400, 401, 402, 429)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTab(ep.path, 'code')}
                      className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                        activeTab === 'code'
                          ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                          : 'bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                      }`}
                    >
                      <FaCode className="text-xs" />
                      <span>Kod Örnekleri (cURL / JS / Python)</span>
                    </button>
                  </div>

                  {/* SEKME 1: İSTEK FORMATI */}
                  {activeTab === 'request' && (
                    <div className="space-y-4">
                      {/* Gerekli Header'lar */}
                      <div className="rounded-xl border border-slate-200 bg-white p-3.5 text-xs dark:border-slate-800 dark:bg-slate-900">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          Zorunlu İstek Başlıkları (Headers):
                        </span>
                        <div className="mt-2 space-y-1 font-mono text-slate-600 dark:text-slate-400">
                          <div>
                            <strong className="text-slate-800 dark:text-slate-200">Content-Type:</strong>{' '}
                            application/json
                          </div>
                          <div>
                            <strong className="text-slate-800 dark:text-slate-200">x-api-key:</strong>{' '}
                            YOUR_API_KEY{' '}
                            <span className="font-sans text-[11px] text-slate-500">
                              (Dashboard &gt; API Anahtarları sayfasından temin edilir)
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Alanlar Tablosu */}
                      {ep.requestProperties.length > 0 && (
                        <div>
                          <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                            İstek Gövdesi Parametreleri
                          </h4>
                          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                            <table className="w-full text-left text-xs">
                              <thead className="border-b border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
                                <tr>
                                  <th className="px-3.5 py-2 font-semibold">Alan Adı</th>
                                  <th className="px-3.5 py-2 font-semibold">Veri Tipi</th>
                                  <th className="px-3.5 py-2 font-semibold">Zorunluluk</th>
                                  <th className="px-3.5 py-2 font-semibold">Açıklama</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {ep.requestProperties.map((p) => (
                                  <tr key={p.name}>
                                    <td className="px-3.5 py-2 font-mono font-bold text-slate-900 dark:text-slate-100">
                                      {p.name}
                                    </td>
                                    <td className="px-3.5 py-2 font-mono text-slate-600 dark:text-slate-400">
                                      {p.type}
                                    </td>
                                    <td className="px-3.5 py-2">
                                      {p.required ? (
                                        <span className="rounded bg-rose-100 px-1.5 py-0.5 font-bold text-[10px] text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                                          ZORUNLU
                                        </span>
                                      ) : (
                                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                          Opsiyonel
                                        </span>
                                      )}
                                    </td>
                                    <td className="px-3.5 py-2 text-slate-600 dark:text-slate-300">
                                      {p.description || '—'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Örnek İstek JSON */}
                      <div>
                        <div className="mb-1.5 flex items-center justify-between">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                            Örnek İstek Gövdesi (JSON Payload)
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              copyToClipboard(
                                JSON.stringify(ep.requestExample, null, 2),
                                `${ep.path}-req`
                              )
                            }
                            className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 font-semibold"
                          >
                            {copiedId === `${ep.path}-req` ? (
                              <>
                                <FaCheck className="text-emerald-500" /> Kopyalandı!
                              </>
                            ) : (
                              <>
                                <FaCopy /> Kopyala
                              </>
                            )}
                          </button>
                        </div>
                        <pre className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-900 p-4 font-mono text-xs leading-relaxed text-slate-100 dark:border-slate-800">
                          <code>{JSON.stringify(ep.requestExample, null, 2)}</code>
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* SEKME 2: BAŞARILI YANIT (200 OK) */}
                  {activeTab === 'response' && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="rounded bg-emerald-100 px-2 py-0.5 font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                          HTTP 200 OK
                        </span>
                        <span className="text-slate-600 dark:text-slate-400">
                          Başarılı işlem sonucunda dönen veri nesnesi
                        </span>
                      </div>

                      <div>
                        <div className="mb-1.5 flex items-center justify-between">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                            Örnek Dönen Yanıt (JSON Response)
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              copyToClipboard(
                                JSON.stringify(ep.responseExample, null, 2),
                                `${ep.path}-res`
                              )
                            }
                            className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 font-semibold"
                          >
                            {copiedId === `${ep.path}-res` ? (
                              <>
                                <FaCheck className="text-emerald-500" /> Kopyalandı!
                              </>
                            ) : (
                              <>
                                <FaCopy /> Kopyala
                              </>
                            )}
                          </button>
                        </div>
                        <pre className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-900 p-4 font-mono text-xs leading-relaxed text-emerald-400 dark:border-slate-800">
                          <code>{JSON.stringify(ep.responseExample, null, 2)}</code>
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* SEKME 3: HATA YANITLARI */}
                  {activeTab === 'errors' && (
                    <div className="space-y-4">
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Tüm API hataları standart <code>success: false</code> zarfında ve Türkçe hata mesajı içeren <code>code</code> ve <code>message</code> alanları ile döner:
                      </p>

                      <div className="grid gap-3 sm:grid-cols-2">
                        {Object.entries(ep.errorExamples).map(([status, item]) => (
                          <div
                            key={status}
                            className="rounded-xl border border-rose-200 bg-white p-3.5 text-xs dark:border-rose-950/60 dark:bg-slate-900"
                          >
                            <div className="mb-1.5 flex items-center justify-between">
                              <span className="font-bold text-rose-700 dark:text-rose-400">
                                HTTP {status} — {item.title}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  copyToClipboard(
                                    JSON.stringify(item.example, null, 2),
                                    `${ep.path}-err-${status}`
                                  )
                                }
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                              >
                                {copiedId === `${ep.path}-err-${status}` ? (
                                  <FaCheck className="text-emerald-500" />
                                ) : (
                                  <FaCopy />
                                )}
                              </button>
                            </div>
                            <pre className="overflow-x-auto rounded-lg bg-slate-900 p-2.5 font-mono text-[11px] leading-relaxed text-rose-300">
                              <code>{JSON.stringify(item.example, null, 2)}</code>
                            </pre>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* SEKME 4: KOD ÖRNEKLERİ */}
                  {activeTab === 'code' && (
                    <div className="space-y-3">
                      {ep.codeSamples.map((sample) => (
                        <div
                          key={sample.label}
                          className="overflow-hidden rounded-xl border border-slate-200 bg-slate-900 text-slate-100 dark:border-slate-800"
                        >
                          <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-4 py-2">
                            <span className="text-xs font-bold text-slate-400">
                              {sample.label}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                copyToClipboard(
                                  sample.source,
                                  `${ep.path}-code-${sample.label}`
                                )
                              }
                              className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                            >
                              {copiedId === `${ep.path}-code-${sample.label}` ? (
                                <>
                                  <FaCheck className="text-emerald-400" /> Kopyalandı!
                                </>
                              ) : (
                                <>
                                  <FaCopy /> Kopyala
                                </>
                              )}
                            </button>
                          </div>
                          <pre className="overflow-x-auto p-4 font-mono text-xs leading-relaxed text-slate-200">
                            <code>{sample.source}</code>
                          </pre>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ApiExplorer;
