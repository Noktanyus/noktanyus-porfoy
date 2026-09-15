'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FaCalendarAlt, FaCopy, FaCheck, FaCode, FaArrowLeft, FaBriefcase, FaSun } from 'react-icons/fa';
import { calculateBusinessDays } from '@/modules/tr-api';

export default function BusinessDaysToolClient() {
  const [startDate, setStartDate] = useState('2026-10-01');
  const [endDate, setEndDate] = useState('2026-10-15');
  const [includeStart, setIncludeStart] = useState(true);
  const [includeEnd, setIncludeEnd] = useState(true);
  const [copied, setCopied] = useState(false);

  let result = null;
  if (startDate && endDate && startDate <= endDate) {
    try {
      result = calculateBusinessDays({ startDate, endDate, includeStart, includeEnd });
    } catch {
      result = null;
    }
  }

  const handleCopyCurl = () => {
    const curl = `curl -X POST "https://noktanyus.com/api/v1/calendar/business-days" \\\n  -H "x-api-key: YOUR_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{"startDate":"${startDate}","endDate":"${endDate}","includeStart":${includeStart},"includeEnd":${includeEnd}}'`;
    navigator.clipboard.writeText(curl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="section-glass-hero bg-blob-decoration py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <div className="relative z-10 space-y-8">
        <div>
          <Link
            href="/araclar"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-brand-primary transition-colors"
          >
            <FaArrowLeft className="w-3.5 h-3.5" />
            <span>Tüm Araçlara Dön</span>
          </Link>
        </div>

        <header className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <FaCalendarAlt className="w-3 h-3" />
            <span>Türkiye Resmi Tatil ve Takvim Algoritması</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white">
            Türkiye İş Günü & Tatil Hesaplama Aracı
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
            İki tarih arasındaki resmi tatilleri ve hafta sonlarını düşerek net çalışma günlerini saniyeler içinde hesaplayın.
          </p>
        </header>

        {/* Form Card */}
        <div className="p-6 sm:p-8 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xl backdrop-blur-sm space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="start-date" className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                Başlangıç Tarihi:
              </label>
              <input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-primary outline-none"
              />
            </div>
            <div>
              <label htmlFor="end-date" className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                Bitiş Tarihi:
              </label>
              <input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-primary outline-none"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={includeStart}
                onChange={(e) => setIncludeStart(e.target.checked)}
                className="w-4 h-4 rounded text-brand-primary focus:ring-brand-primary"
              />
              <span>Başlangıç gününü dahil et</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={includeEnd}
                onChange={(e) => setIncludeEnd(e.target.checked)}
                className="w-4 h-4 rounded text-brand-primary focus:ring-brand-primary"
              />
              <span>Bitiş gününü dahil et</span>
            </label>
          </div>

          {/* Results */}
          {result && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center">
                <span className="block text-xs font-semibold text-slate-500 mb-1">Toplam Gün:</span>
                <span className="text-2xl font-extrabold text-slate-900 dark:text-white">{result.calendarDays}</span>
              </div>
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center">
                <span className="flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 mb-1">
                  <FaBriefcase className="w-3 h-3" />
                  <span>Net İş Günü:</span>
                </span>
                <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  {result.businessDays}
                </span>
              </div>
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center">
                <span className="block text-xs font-semibold text-slate-500 mb-1">Hafta Sonu:</span>
                <span className="text-2xl font-extrabold text-slate-700 dark:text-slate-300">
                  {result.weekendDays}
                </span>
              </div>
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center">
                <span className="flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-500 mb-1">
                  <FaSun className="w-3 h-3 text-amber-500" />
                  <span>Resmi Tatil:</span>
                </span>
                <span className="text-2xl font-extrabold text-slate-700 dark:text-slate-300">
                  {result.holidayDays}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* API CTA */}
        <div className="p-6 sm:p-8 rounded-2xl bg-slate-900 text-white border border-slate-800 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <FaCode className="w-5 h-5 text-brand-primary" />
              <h3 className="text-lg font-bold">Kargo, İK ve Teslimat Sürelerini Otomatikleştirin</h3>
            </div>
            <button
              type="button"
              onClick={handleCopyCurl}
              className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors self-start sm:self-auto"
            >
              {copied ? <FaCheck className="w-3.5 h-3.5 text-emerald-400" /> : <FaCopy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Kopyalandı!' : 'cURL Kopyala'}</span>
            </button>
          </div>

          <pre className="p-4 rounded-xl bg-slate-950 font-mono text-xs sm:text-sm text-slate-300 overflow-x-auto border border-slate-800/80">
{`curl -X POST "https://noktanyus.com/api/v1/calendar/business-days" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"startDate":"${startDate}","endDate":"${endDate}","includeStart":${includeStart},"includeEnd":${includeEnd}}'`}
          </pre>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            <span className="text-xs text-slate-400">Bayram ve resmi tatiller otomatik olarak güncel tutulur.</span>
            <div className="flex items-center gap-3">
              <Link
                href="/docs#tag/TR-API/operation/api-v1-calendar-business-days-post"
                className="text-xs font-bold text-brand-primary hover:underline"
              >
                API Dokümantasyonu →
              </Link>
              <Link
                href="/kayit"
                className="px-4 py-2 rounded-lg bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-bold transition-colors"
              >
                Ücretsiz Başlayın
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
