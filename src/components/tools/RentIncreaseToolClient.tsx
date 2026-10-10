'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  FaArrowLeft,
  FaHome,
  FaBuilding,
  FaPercentage,
  FaCalculator,
  FaChartLine,
  FaCopy,
  FaCheck,
  FaGavel,
  FaInfoCircle,
} from 'react-icons/fa';
import TrackRecentTool from '@/components/tools/TrackRecentTool';
import {
  calculateRentIncrease,
  OFFICIAL_TUFE_RATES,
  type RentIncreaseInput,
} from '@/modules/tr-api/rentIncrease';

export default function RentIncreaseToolClient() {
  const [currentRent, setCurrentRent] = useState<number>(25000);
  const [propertyType, setPropertyType] = useState<'residential' | 'commercial'>('residential');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('2024-10');
  const [useCustomRate, setUseCustomRate] = useState<boolean>(false);
  const [customRate, setCustomRate] = useState<number>(62.02);
  const [commercialTaxMode, setCommercialTaxMode] = useState<'none' | 'stopaj' | 'vat'>('stopaj');
  const [copied, setCopied] = useState<boolean>(false);

  const [year, month] = useMemo(() => {
    const [y, m] = selectedPeriod.split('-').map(Number);
    return [y, m];
  }, [selectedPeriod]);

  const calculationInput: RentIncreaseInput = useMemo(() => {
    return {
      currentRent: Number(currentRent) || 0,
      propertyType,
      year,
      month,
      customTufeRate: useCustomRate ? Number(customRate) || 0 : undefined,
      commercialTaxMode: propertyType === 'commercial' ? commercialTaxMode : 'none',
    };
  }, [currentRent, propertyType, year, month, useCustomRate, customRate, commercialTaxMode]);

  const result = useMemo(() => {
    return calculateRentIncrease(calculationInput);
  }, [calculationInput]);

  const curlCommand = useMemo(() => {
    const payload = JSON.stringify(calculationInput, null, 2);
    return `curl -X POST https://noktanyus.com/api/v1/finance/rent-increase \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '${payload}'`;
  }, [calculationInput]);

  const copyCurl = async () => {
    try {
      await navigator.clipboard.writeText(curlCommand);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="section-glass-hero bg-blob-decoration py-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      <TrackRecentTool slug="kira-artis-orani-hesaplama" title="Kira Artış Oranı Hesaplama" />

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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <FaGavel className="w-3 h-3" />
            <span>6098 Sayılı TBK Madde 344 & TÜİK 12 Aylık TÜFE Tavanı</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white">
            Yasal Kira Artış Oranı & TÜFE Tavanı Hesaplama
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base max-w-3xl">
            1 Temmuz 2024 itibarıyla konutlardaki %25 sınır kalkmış, tüm konut ve işyerlerinde yasal tavan{' '}
            <strong>TÜİK 12 Aylık Ortalama TÜFE Oranı</strong> olmuştur. Sözleşme yenileme ayınıza göre yasal azami kira bedelini,
            artış tutarını ve işyeri stopaj/KDV dökümünü anında hesaplayın.
          </p>
        </header>

        {/* Main Grid: Form and Results */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Inputs Section */}
          <div className="lg:col-span-6 p-6 sm:p-8 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xl backdrop-blur-sm space-y-6">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
              <FaCalculator className="w-4 h-4 text-brand-primary" />
              Kira & Sözleşme Parametreleri
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Mevcut Aylık Kira Bedeli (TL)
                </label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={currentRent}
                  onChange={(e) => setCurrentRent(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm"
                />
              </div>

              {/* Property Type Toggle */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Gayrimenkul Türü
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPropertyType('residential')}
                    className={`py-2.5 px-4 rounded-xl border text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                      propertyType === 'residential'
                        ? 'border-brand-primary bg-brand-primary/10 text-brand-primary font-bold'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <FaHome className="w-4 h-4" />
                    <span>Konut (Mesken)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPropertyType('commercial')}
                    className={`py-2.5 px-4 rounded-xl border text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                      propertyType === 'commercial'
                        ? 'border-brand-primary bg-brand-primary/10 text-brand-primary font-bold'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <FaBuilding className="w-4 h-4" />
                    <span>Çatılı İşyeri</span>
                  </button>
                </div>
              </div>

              {/* Commercial Tax Mode */}
              {propertyType === 'commercial' && (
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 space-y-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    İşyeri Vergi Durumu
                  </label>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setCommercialTaxMode('stopaj')}
                      className={`p-2 rounded-lg border text-center transition-all ${
                        commercialTaxMode === 'stopaj'
                          ? 'border-brand-primary bg-brand-primary/10 text-brand-primary font-bold'
                          : 'border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      %20 Stopaj
                    </button>
                    <button
                      type="button"
                      onClick={() => setCommercialTaxMode('vat')}
                      className={`p-2 rounded-lg border text-center transition-all ${
                        commercialTaxMode === 'vat'
                          ? 'border-brand-primary bg-brand-primary/10 text-brand-primary font-bold'
                          : 'border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      %20 KDV
                    </button>
                    <button
                      type="button"
                      onClick={() => setCommercialTaxMode('none')}
                      className={`p-2 rounded-lg border text-center transition-all ${
                        commercialTaxMode === 'none'
                          ? 'border-brand-primary bg-brand-primary/10 text-brand-primary font-bold'
                          : 'border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      Vergisiz / Net
                    </button>
                  </div>
                </div>
              )}

              {/* Month Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Sözleşme Yenileme Ayı (TÜİK Oranı)
                </label>
                <select
                  disabled={useCustomRate}
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm disabled:opacity-50"
                >
                  {OFFICIAL_TUFE_RATES.map((item) => (
                    <option key={`${item.year}-${item.month}`} value={`${item.year}-${item.month}`}>
                      {item.monthName} — TÜİK 12 Aylık Ort: %{item.twelveMonthAverageRate}
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom Rate Toggle */}
              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={useCustomRate}
                    onChange={(e) => setUseCustomRate(e.target.checked)}
                    className="w-4 h-4 text-brand-primary rounded focus:ring-brand-primary border-slate-300"
                  />
                  <span>Farklı veya Özel Bir Artış Oranı Girmek İstiyorum</span>
                </label>

                {useCustomRate && (
                  <div className="mt-2">
                    <input
                      type="number"
                      min="0"
                      max="200"
                      step="0.01"
                      value={customRate}
                      onChange={(e) => setCustomRate(Number(e.target.value))}
                      placeholder="Örn: 55.5"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Results Section */}
          <div className="lg:col-span-6 space-y-6">
            {/* New Rent Hero Card */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-200">
                  Yasal Azami Kira Bedeli (Yeni Tavan)
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/20 text-white">
                  %{result.appliedRatePercent} Artış
                </span>
              </div>
              <div className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                {result.newRent.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                <span className="text-sm font-normal text-blue-200 ml-1">/ ay</span>
              </div>
              <div className="text-xs text-blue-100 flex items-center gap-1.5 pt-1">
                <span>Aylık Kira Artış Tutarı:</span>
                <strong className="text-white">+{result.increaseAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</strong>
              </div>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Uygulanan Tavan Oran
                </span>
                <span className="text-xl sm:text-2xl font-extrabold text-blue-600 dark:text-blue-400 mt-1 block">
                  %{result.appliedRatePercent}
                </span>
                <span className="text-xs text-slate-400 mt-1 block truncate">
                  {result.periodName}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Yıllık Toplam Artış Farkı
                </span>
                <span className="text-xl sm:text-2xl font-extrabold text-rose-600 dark:text-rose-400 mt-1 block">
                  +{result.annualComparison.annualIncreaseDifference.toLocaleString('tr-TR')} TL
                </span>
                <span className="text-xs text-slate-400 mt-1 block">
                  12 Aylık Ek Yük
                </span>
              </div>
            </div>

            {/* Commercial Tax Breakdown (if enabled) */}
            {result.commercialTaxBreakdown && (
              <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-950 dark:text-amber-200 space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <FaBuilding className="w-4 h-4 text-amber-600" />
                  İşyeri Vergi Dökümü ({result.commercialTaxBreakdown.mode === 'stopaj' ? '%20 Stopaj' : '%20 KDV'})
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs pt-1">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block">Net Kira:</span>
                    <strong className="text-slate-900 dark:text-white">
                      {result.commercialTaxBreakdown.netRent.toLocaleString('tr-TR')} TL
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block">Vergi Tutarı:</span>
                    <strong className="text-amber-600 dark:text-amber-400">
                      {result.commercialTaxBreakdown.taxAmount.toLocaleString('tr-TR')} TL
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block">Brüt / Toplam:</span>
                    <strong className="text-slate-900 dark:text-white">
                      {result.commercialTaxBreakdown.grossTotal.toLocaleString('tr-TR')} TL
                    </strong>
                  </div>
                </div>
                <p className="text-[11px] opacity-80 pt-1">
                  {result.commercialTaxBreakdown.explanation}
                </p>
              </div>
            )}

            {/* Legal Notice Box */}
            <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                <FaInfoCircle className="w-3.5 h-3.5 text-brand-primary" />
                Hukuki Bilgilendirme (TBK Madde 344)
              </div>
              <p className="leading-relaxed">
                Tarafların yenilenen kira dönemlerinde uygulanacak kira bedeline ilişkin anlaşmaları, bir önceki kira yılının
                tüketici fiyat endeksindeki (TÜFE) on iki aylık ortalamalara göre değişim oranını geçmemek koşuluyla geçerlidir.
                Bu kuralın üzerindeki artış oranları geçersizdir.
              </p>
            </div>
          </div>
        </div>

        {/* Developer API Section */}
        <div className="p-6 sm:p-8 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FaChartLine className="w-4 h-4 text-brand-primary" />
                Geliştiriciler İçin REST API Entegrasyonu
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Emlak veya gayrimenkul ERP yazılımlarınızda otomatik kira güncellemesi için:
              </p>
            </div>
            <button
              onClick={copyCurl}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors shrink-0"
            >
              {copied ? <FaCheck className="w-3.5 h-3.5 text-emerald-500" /> : <FaCopy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Kopyalandı' : 'cURL Kopyala'}</span>
            </button>
          </div>
          <pre className="p-4 rounded-xl bg-slate-950 text-slate-100 text-xs font-mono overflow-x-auto">
            {curlCommand}
          </pre>
        </div>
      </div>
    </div>
  );
}
