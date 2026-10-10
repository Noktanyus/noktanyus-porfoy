'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  FaCalculator,
  FaCopy,
  FaCheck,
  FaArrowLeft,
  FaGavel,
  FaCalendarAlt,
  FaCoins,
  FaBalanceScale,
  FaInfoCircle,
} from 'react-icons/fa';
import {
  calculateLegalInterest,
  type InterestType,
} from '@/modules/tr-api/legalInterest';
import { TrackRecentTool } from '@/components/tools/TrackRecentTool';

export default function LegalInterestToolClient() {
  const [principalStr, setPrincipalStr] = useState('100000');
  const [startDate, setStartDate] = useState('2024-01-01');
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [interestType, setInterestType] = useState<InterestType>('commercial_default');
  const [customRateStr, setCustomRateStr] = useState('30');
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);

  const principal = parseFloat(principalStr) || 0;
  const customRate = parseFloat(customRateStr) || 0;

  const result = calculateLegalInterest({
    principal,
    startDate,
    endDate,
    interestType,
    customRate: interestType === 'custom' ? customRate : undefined,
  });

  const handleCopySummary = () => {
    if (!result) return;
    const periodLines = result.periods
      .map(
        (p) =>
          `• ${p.periodStartDate} - ${p.periodEndDate} (${p.days} gün) @ %${p.annualRate} = ₺${p.periodInterest.toFixed(2)} [${p.legalBasis}]`
      )
      .join('\n');

    const text = `--- ${result.interestTypeName.toUpperCase()} DÖKÜMÜ ---
Anapara Tutarı: ₺${result.principal.toFixed(2)}
Faiz Başlangıç - Bitiş: ${result.startDate} - ${result.endDate} (${result.totalDays} gün)
Faiz Türü: ${result.interestTypeName}
------------------------------------------
KADEMELİ DÖNEM FAİZLERİ:
${periodLines}
------------------------------------------
TOPLAM TAHAKKUK EDEN FAİZ: ₺${result.totalInterest.toFixed(2)}
TOPLAM GERİ ÖDENECEK TUTAR: ₺${result.totalPayable.toFixed(2)}
Hesaplama: Noktanyus Hukuk & Finans Motoru (noktanyus.com/araclar/yasal-faiz-hesaplama)`;

    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  const handleCopyCurl = () => {
    const curl = `curl -X POST "https://noktanyus.com/api/v1/finance/legal-interest" \\\n  -H "x-api-key: YOUR_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{"principal":${principal},"startDate":"${startDate}","endDate":"${endDate}","interestType":"${interestType}"}'`;
    navigator.clipboard.writeText(curl);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  const setPresetDates = (daysAgo: number) => {
    const now = new Date();
    const past = new Date();
    past.setDate(now.getDate() - daysAgo);
    setStartDate(past.toISOString().slice(0, 10));
    setEndDate(now.toISOString().slice(0, 10));
  };

  return (
    <div className="section-glass-hero bg-blob-decoration py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      <TrackRecentTool slug="yasal-faiz-hesaplama" title="Yasal Faiz" />

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
            <span>3095 Sayılı Kanun & TTK m.1530 Kademeli Faiz Motoru</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white">
            TCMB Yasal & Ticari Temerrüt Faizi Hesaplama
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
            Vadesi geçmiş ticari faturalar, sözleşmeler ve dava/icra alacakları için Resmi Gazete&apos;de yayımlanan
            kademeli oranlara göre gün bazında yasal ve ticari temerrüt faizi dökümü hesaplayın.
          </p>
        </header>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Form Column */}
          <div className="lg:col-span-7 p-6 sm:p-7 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xl backdrop-blur-sm space-y-5">
            <h2 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
              <FaCalculator className="text-brand-primary w-4 h-4" />
              <span>Alacak & Tarih Parametreleri</span>
            </h2>

            {/* Principal Amount */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Alacak / Fatura Anapara Tutarı (TL)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₺</span>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={principalStr}
                  onChange={(e) => setPrincipalStr(e.target.value)}
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-bold text-base focus:ring-2 focus:ring-brand-primary"
                />
              </div>
            </div>

            {/* Interest Type Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Faiz Türü
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setInterestType('commercial_default')}
                  className={`p-3 rounded-xl border text-left text-xs font-semibold transition-all ${
                    interestType === 'commercial_default'
                      ? 'border-brand-primary bg-brand-primary/10 text-brand-primary ring-1 ring-brand-primary'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span className="font-bold block">Ticari Temerrüt</span>
                  <span className="text-[11px] text-slate-500">TTK m.1530 (2024: %48)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setInterestType('legal')}
                  className={`p-3 rounded-xl border text-left text-xs font-semibold transition-all ${
                    interestType === 'legal'
                      ? 'border-brand-primary bg-brand-primary/10 text-brand-primary ring-1 ring-brand-primary'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span className="font-bold block">Yasal Faiz</span>
                  <span className="text-[11px] text-slate-500">3095 s.K. (2024: %24)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setInterestType('custom')}
                  className={`p-3 rounded-xl border text-left text-xs font-semibold transition-all ${
                    interestType === 'custom'
                      ? 'border-brand-primary bg-brand-primary/10 text-brand-primary ring-1 ring-brand-primary'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span className="font-bold block">Özel Faiz Oranı</span>
                  <span className="text-[11px] text-slate-500">Kullanıcı tanımlı %</span>
                </button>
              </div>

              {interestType === 'custom' && (
                <div className="pt-2">
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    Yıllık Faiz Oranı (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={customRateStr}
                    onChange={(e) => setCustomRateStr(e.target.value)}
                    className="w-full py-2 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm"
                  />
                </div>
              )}
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Faiz Başlangıç Tarihi
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full py-2.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Faiz Bitiş / Ödeme Tarihi
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full py-2.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-primary"
                />
              </div>
            </div>

            {/* Date Preset Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Hızlı Aralık:
              </span>
              <button
                type="button"
                onClick={() => setPresetDates(30)}
                className="px-2.5 py-1 text-xs rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-brand-primary/10 hover:text-brand-primary transition-colors"
              >
                Son 30 Gün
              </button>
              <button
                type="button"
                onClick={() => setPresetDates(90)}
                className="px-2.5 py-1 text-xs rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-brand-primary/10 hover:text-brand-primary transition-colors"
              >
                Son 90 Gün
              </button>
              <button
                type="button"
                onClick={() => setPresetDates(365)}
                className="px-2.5 py-1 text-xs rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-brand-primary/10 hover:text-brand-primary transition-colors"
              >
                Son 1 Yıl
              </button>
              <button
                type="button"
                onClick={() => {
                  setStartDate('2024-01-01');
                  setEndDate('2024-12-31');
                }}
                className="px-2.5 py-1 text-xs rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-brand-primary/10 hover:text-brand-primary transition-colors"
              >
                Tüm 2024
              </button>
            </div>
          </div>

          {/* Results Column */}
          <div className="lg:col-span-5 space-y-4">
            {/* Total Result Card */}
            <div className="p-6 sm:p-7 rounded-2xl bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-transparent border border-blue-500/30 shadow-xl backdrop-blur-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Toplam Tahakkuk Eden Faiz
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                  <FaCalendarAlt className="w-3 h-3" />
                  <span>{result.totalDays} Gün</span>
                </span>
              </div>

              <div>
                <div className="text-3xl sm:text-4xl font-extrabold text-blue-600 dark:text-blue-400">
                  ₺{result.totalInterest.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {result.interestTypeName}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800/60 space-y-2 text-xs">
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                  <span>Anapara:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    ₺{result.principal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-400 text-sm font-bold">
                  <span className="text-slate-900 dark:text-white">Toplam Geri Ödenecek:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 text-base">
                    ₺{result.totalPayable.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Periods Breakdown Table */}
            {result.periods.length > 0 && (
              <div className="p-5 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 text-xs space-y-3 shadow-sm">
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  Kademeli Dönem Dökümü ({result.periods.length} Dilim)
                </h3>

                <div className="space-y-2">
                  {result.periods.map((p, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/60 space-y-1"
                    >
                      <div className="flex justify-between items-center font-bold text-slate-900 dark:text-white">
                        <span>
                          {p.periodStartDate} — {p.periodEndDate}
                        </span>
                        <span className="text-blue-600 dark:text-blue-400 font-mono">
                          ₺{p.periodInterest.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                        <span>
                          {p.days} gün • Yıllık %{p.annualRate}
                        </span>
                        <span className="line-clamp-1 max-w-[180px] text-right" title={p.legalBasis}>
                          {p.legalBasis}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    onClick={handleCopySummary}
                    className="flex-1 py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-brand-primary hover:text-white font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    {copiedSummary ? <FaCheck className="w-3 h-3" /> : <FaCopy className="w-3 h-3" />}
                    <span>{copiedSummary ? 'Döküm Kopyalandı' : 'Faiz Özetini Kopyala'}</span>
                  </button>
                  <button
                    onClick={handleCopyCurl}
                    className="py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-semibold transition-colors"
                    title="cURL İsteğini Kopyala"
                  >
                    {copiedCurl ? <FaCheck className="w-3 h-3 text-emerald-500" /> : <FaCoins className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Informative Legal Section */}
        <div className="p-6 sm:p-8 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 space-y-4">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold">
            <FaInfoCircle className="text-blue-500 w-4 h-4 shrink-0" />
            <h3 className="text-base sm:text-lg">Yasal Faiz ile Ticari Temerrüt Faizi Arasındaki Fark Nedir?</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/60 dark:border-slate-800/60 space-y-1.5">
              <span className="font-bold text-slate-900 dark:text-white block">
                1. Ticari Temerrüt Faizi (TTK m.1530):
              </span>
              <p>
                Tacirler arasındaki ticari işlerde, mal ve hizmet tedarikinde faturanın vadesinde ödenmemesi durumunda
                doğrudan uygulanır. 2024 yılı için TCMB tarafından <strong>yıllık %48</strong> olarak belirlenmiştir.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/60 dark:border-slate-800/60 space-y-1.5">
              <span className="font-bold text-slate-900 dark:text-white block">
                2. Yasal Kanuni Faiz (3095 s.K. m.1):
              </span>
              <p>
                Sözleşmede faiz oranı kararlaştırılmamış genel borçlarda ve adi alacak davalarında uygulanır.
                1 Haziran 2024 tarihinden itibaren <strong>yıllık %24</strong> (öncesinde %9) olarak uygulanmaktadır.
              </p>
            </div>
          </div>
        </div>

        {/* API CTA */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 border border-blue-500/30 text-white flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="space-y-1 text-center md:text-left">
            <h4 className="font-bold text-lg">Faiz Tahakkukunu API ile Otomatikleştirin</h4>
            <p className="text-slate-300 text-xs sm:text-sm max-w-xl">
              <code className="text-sky-300 font-mono">POST /api/v1/finance/legal-interest</code> uç noktası ile ERP,
              hukuk bürosu veya CRM yazılımınıza vadesi geçen borçlar için kademeli faiz motoru ekleyin.
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
