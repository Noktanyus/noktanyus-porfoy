'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  FaSearch,
  FaCopy,
  FaCheck,
  FaArrowLeft,
  FaShieldAlt,
  FaExclamationTriangle,
  FaTimes,
  FaCode,
  FaInfoCircle,
  FaBuilding,
} from 'react-icons/fa';
import {
  searchNace,
  type DangerLevel,
  type NaceItem,
} from '@/modules/tr-api/nace';
import { TrackRecentTool } from '@/components/tools/TrackRecentTool';

const POPULAR_NACE_PRESETS = [
  { label: 'Yazılım (62.01.01)', q: '62.01.01' },
  { label: 'E-Ticaret (47.91.14)', q: '47.91.14' },
  { label: 'Kurye & Kargo (53.20.09)', q: '53.20.09' },
  { label: 'Reklam Ajansı (73.11.01)', q: '73.11.01' },
  { label: 'Danışmanlık (70.22.02)', q: '70.22.02' },
  { label: 'İnşaat (41.20.02)', q: '41.20.02' },
];

export default function NaceToolClient() {
  const [query, setQuery] = useState('');
  const [dangerFilter, setDangerFilter] = useState<DangerLevel | ''>('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [copiedCurl, setCopiedCurl] = useState(false);

  const results = useMemo(() => {
    return searchNace(query, {
      dangerLevel: dangerFilter || undefined,
      limit: 100,
    });
  }, [query, dangerFilter]);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleCopyCurl = () => {
    const curl = `curl -X POST "https://noktanyus.com/api/v1/business/nace" \\\n  -H "x-api-key: YOUR_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{"query":"${query || 'yazılım'}","dangerLevel":"${dangerFilter || ''}"}'`;
    navigator.clipboard.writeText(curl);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  return (
    <div className="section-glass-hero bg-blob-decoration py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      <TrackRecentTool slug="nace-kodu-sorgulama" title="NACE Kodu Sorgulama" />

      <div className="relative z-10 space-y-8">
        {/* Navigation */}
        <div>
          <Link
            href="/araclar"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-brand-primary transition-colors"
          >
            <FaArrowLeft className="w-3.5 h-3.5" />
            <span>Tüm Araçlara Dön</span>
          </Link>
        </div>

        {/* Header */}
        <header className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <FaShieldAlt className="w-3 h-3" />
            <span>6331 Sayılı İSG Kanunu & TOBB Resmi NACE Rev.2 Veritabanı</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white">
            Türkiye NACE Kodu & İSG Tehlike Sınıfı Rehberi
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
            Şirket kuruluşu, vergi levhası ve SGK tescili için 6 haneli resmi NACE faaliyet kodunu bulun.
            İş yerinizin İSG tehlike sınıfını (Az Tehlikeli, Tehlikeli, Çok Tehlikeli) ve iş güvenliği yükümlülüklerini anında öğrenin.
          </p>
        </header>

        {/* Search & Filters */}
        <div className="p-6 sm:p-8 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xl backdrop-blur-sm space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-8 relative">
              <label htmlFor="nace-search-input" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Faaliyet Kelimesi veya 6 Haneli NACE Kodu
              </label>
              <div className="relative">
                <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="nace-search-input"
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Örn: Yazılım, e-ticaret, kargo, restoran veya 62.01.01..."
                  className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary text-sm sm:text-base"
                />
                {query && (
                  <button
                    onClick={() => setQuery('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    aria-label="Aramayı Temizle"
                  >
                    <FaTimes className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="md:col-span-4">
              <label htmlFor="danger-level-select" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                İSG Tehlike Sınıfı
              </label>
              <select
                id="danger-level-select"
                value={dangerFilter}
                onChange={(e) => setDangerFilter(e.target.value as DangerLevel | '')}
                className="w-full py-3 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-primary text-sm sm:text-base"
              >
                <option value="">Tüm Tehlike Sınıfları</option>
                <option value="az_tehlikeli">Az Tehlikeli (Yeşil)</option>
                <option value="tehlikeli">Tehlikeli (Sarı)</option>
                <option value="cok_tehlikeli">Çok Tehlikeli (Kırmızı)</option>
              </select>
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Popüler Sektörler:
            </span>
            {POPULAR_NACE_PRESETS.map((item) => (
              <button
                key={item.label}
                onClick={() => setQuery(item.q)}
                className="px-2.5 py-1 text-xs rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-brand-primary/10 hover:text-brand-primary transition-colors border border-slate-200/80 dark:border-slate-700/80"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400 px-1">
          <div>
            Toplam <span className="font-bold text-slate-900 dark:text-white">{results.length}</span> NACE faaliyeti listeleniyor
          </div>
          <button
            onClick={handleCopyCurl}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-primary hover:underline"
          >
            {copiedCurl ? <FaCheck className="w-3 h-3 text-emerald-500" /> : <FaCode className="w-3 h-3" />}
            <span>{copiedCurl ? 'cURL Kopyalandı' : 'cURL API İsteğini Kopyala'}</span>
          </button>
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {results.map((item) => {
            const isCodeCopied = copiedCode === item.code;
            return (
              <div
                key={item.code}
                className="p-5 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800/90 shadow-sm hover:shadow-md hover:border-brand-primary/40 transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <span className="font-mono font-extrabold text-lg text-brand-primary bg-brand-primary/10 px-2.5 py-1 rounded-lg">
                      {item.code}
                    </span>

                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full shrink-0 flex items-center gap-1.5 ${
                        item.dangerLevel === 'az_tehlikeli'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                          : item.dangerLevel === 'tehlikeli'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300'
                      }`}
                    >
                      <FaShieldAlt className="w-3 h-3" />
                      <span>{item.dangerLevelName}</span>
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-snug mb-1">
                    {item.name}
                  </h3>

                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Sektör: <strong>{item.sector}</strong>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60 flex items-start gap-2">
                    <FaInfoCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-blue-500" />
                    <span>{item.osgbObligation}</span>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={() => handleCopyCode(item.code)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                        isCodeCopied
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-brand-primary hover:text-white'
                      }`}
                    >
                      {isCodeCopied ? <FaCheck className="w-3 h-3" /> : <FaCopy className="w-3 h-3" />}
                      <span>{isCodeCopied ? 'Kopyalandı' : 'Kodu Kopyala'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {results.length === 0 && (
          <div className="p-8 text-center rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
            <FaExclamationTriangle className="w-10 h-10 text-slate-400 mx-auto" />
            <h4 className="font-bold text-slate-800 dark:text-slate-200">Faaliyet kodu bulunamadı</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Arama filtrenizi genişletin veya farklı bir anahtar kelime deneyin.
            </p>
          </div>
        )}

        {/* API CTA */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-950 via-emerald-950 to-teal-950 border border-emerald-500/30 text-white flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="space-y-1 text-center md:text-left">
            <h4 className="font-bold text-lg">NACE Kodlarını REST API Olarak Kullanın</h4>
            <p className="text-slate-300 text-xs sm:text-sm max-w-xl">
              <code className="text-emerald-300 font-mono">POST /api/v1/business/nace</code> uç noktası ile
              şirket tescili ve onboarding formlarınıza anında faaliyet autocomplete ekleyin.
            </p>
          </div>
          <Link
            href="/docs"
            className="px-5 py-2.5 rounded-xl bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs sm:text-sm shrink-0 transition-colors shadow"
          >
            API Dokümantasyonu
          </Link>
        </div>
      </div>
    </div>
  );
}
