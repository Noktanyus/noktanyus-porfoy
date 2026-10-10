'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  FaArrowLeft,
  FaCalculator,
  FaUserGraduate,
  FaMoneyBillWave,
  FaPiggyBank,
  FaShieldAlt,
  FaCheckCircle,
  FaCopy,
  FaCheck,
  FaInfoCircle,
  FaChartPie,
  FaCalendarAlt,
} from 'react-icons/fa';
import TrackRecentTool from '@/components/tools/TrackRecentTool';
import {
  calculateYoungEntrepreneurBenefit,
  OFFICIAL_EXEMPTIONS,
  DEFAULT_MONTHLY_BAGKUR_2024,
  DEFAULT_MONTHLY_BAGKUR_2025,
  type YoungEntrepreneurInput,
} from '@/modules/tr-api/youngEntrepreneur';

export default function YoungEntrepreneurToolClient() {
  const [annualRevenue, setAnnualRevenue] = useState<number>(600000);
  const [annualExpenses, setAnnualExpenses] = useState<number>(150000);
  const [year, setYear] = useState<2024 | 2025>(2024);
  const [includeBagkur, setIncludeBagkur] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  const calculationInput: YoungEntrepreneurInput = useMemo(() => {
    return {
      annualRevenue: Number(annualRevenue) || 0,
      annualExpenses: Number(annualExpenses) || 0,
      year,
      includeBagkurSupport: includeBagkur,
    };
  }, [annualRevenue, annualExpenses, year, includeBagkur]);

  const result = useMemo(() => {
    return calculateYoungEntrepreneurBenefit(calculationInput);
  }, [calculationInput]);

  const curlCommand = useMemo(() => {
    const payload = JSON.stringify(calculationInput, null, 2);
    return `curl -X POST https://noktanyus.com/api/v1/finance/young-entrepreneur \\
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

  const currentExemptionLimit = OFFICIAL_EXEMPTIONS[year];
  const currentMonthlyBagkur = year === 2025 ? DEFAULT_MONTHLY_BAGKUR_2025 : DEFAULT_MONTHLY_BAGKUR_2024;

  return (
    <div className="section-glass-hero bg-blob-decoration py-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      <TrackRecentTool slug="genc-girisimci-istisnasi-hesaplama" title="Genç Girişimci İstisnası Hesaplama" />

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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
            <FaUserGraduate className="w-3 h-3" />
            <span>193 Sayılı GVK Mükerrer m.20/A & 5510 Sayılı Kanun m.81/k</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white">
            Genç Girişimci İstisnası & Bağkur Desteği Hesaplama
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base max-w-3xl">
            18-29 yaş arası şahıs şirketi açan girişimciler için 3 vergilendirme dönemi boyunca yıllık{' '}
            <strong>{currentExemptionLimit.toLocaleString('tr-TR')} TL</strong> gelir vergisi istisnası ve 1 yıl boyunca{' '}
            <strong>aylık ~{currentMonthlyBagkur.toLocaleString('tr-TR')} TL</strong> SGK Bağkur prim desteği kazancınızı anında hesaplayın.
          </p>
        </header>

        {/* Main Grid: Form and Results */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Inputs Section */}
          <div className="lg:col-span-6 p-6 sm:p-8 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xl backdrop-blur-sm space-y-6">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
              <FaCalculator className="w-4 h-4 text-brand-primary" />
              Gelir & İşletme Bilgileri
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Yıllık Tahmini Ciro / Gelir (TL, KDV Hariç)
                </label>
                <input
                  type="number"
                  min="0"
                  step="10000"
                  value={annualRevenue}
                  onChange={(e) => setAnnualRevenue(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Yıllık İşletme Giderleri (TL, KDV Hariç)
                </label>
                <input
                  type="number"
                  min="0"
                  step="5000"
                  value={annualExpenses}
                  onChange={(e) => setAnnualExpenses(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Kira, yazılım, sunucu, muhasebe ücreti ve diğer ticari harcamalar
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Vergilendirme Yılı
                  </label>
                  <select
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value) as 2024 | 2025)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm"
                  >
                    <option value={2024}>2024 (230.000 TL İstisna)</option>
                    <option value={2025}>2025 (330.000 TL İstisna)</option>
                  </select>
                </div>

                <div className="flex flex-col justify-end">
                  <label className="relative flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={includeBagkur}
                      onChange={(e) => setIncludeBagkur(e.target.checked)}
                      className="w-4 h-4 text-brand-primary rounded focus:ring-brand-primary border-slate-300"
                    />
                    <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                      1 Yıl Bağkur Desteği
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Quick Profit Summary */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 flex justify-between items-center text-sm">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Vergi Öncesi Yıllık Net Kâr:</span>
              <span className="font-extrabold text-slate-900 dark:text-white">
                {result.annualGrossProfit.toLocaleString('tr-TR')} TL
              </span>
            </div>
          </div>

          {/* Results Summary & KPI Cards */}
          <div className="lg:col-span-6 space-y-6">
            {/* Main Total Benefit Card */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 text-white shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-violet-200 flex items-center gap-2">
                  <FaPiggyBank className="w-4 h-4" />
                  Yıllık Toplam Cebinizde Kalan Kazanç
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/20 text-white">
                  Devlet Teşviki
                </span>
              </div>
              <div className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                +{result.totalAnnualBenefit.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
              </div>
              <p className="text-xs text-violet-200 leading-relaxed">
                İstisna ve Bağkur prim desteği sayesinde normal bir mükellefe kıyasla yılda{' '}
                <strong>{result.totalAnnualBenefit.toLocaleString('tr-TR')} TL</strong> (aylık ortalama{' '}
                <strong>{result.monthlyAverageSavings.toLocaleString('tr-TR')} TL</strong>) daha fazla kazanırsınız.
              </p>
            </div>

            {/* Benefit Breakdown Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Gelir Vergisi Tasarrufu
                </span>
                <span className="text-xl sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 block">
                  +{result.taxSavings.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                </span>
                <span className="text-xs text-slate-400 mt-1 block">
                  İstisna: {result.appliedExemptionAmount.toLocaleString('tr-TR')} TL
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  1 Yıllık Bağkur Desteği
                </span>
                <span className="text-xl sm:text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1 block">
                  +{result.bagkurSavings.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                </span>
                <span className="text-xs text-slate-400 mt-1 block">
                  {includeBagkur ? 'Hazinece Karşılanır' : 'Dahil Edilmedi'}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Teşvikli Net Yıllık Gelir
                </span>
                <span className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-1 block">
                  {result.incentivizedNetIncome.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                </span>
                <span className="text-xs text-slate-400 mt-1 block">
                  Aylık Ortalama: {result.monthlyAverageNetIncome.toLocaleString('tr-TR')} TL
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Efektif Vergi Oranı
                </span>
                <span className="text-xl sm:text-2xl font-extrabold text-violet-600 dark:text-violet-400 mt-1 block">
                  %{result.effectiveTaxRateWithIncentive}
                </span>
                <span className="text-xs text-slate-400 mt-1 block">
                  Teşviksiz: %{result.effectiveTaxRateStandard} idi
                </span>
              </div>
            </div>

            {/* Comparison Table */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <FaChartPie className="w-3.5 h-3.5 text-brand-primary" />
                Normal Mükellef vs Genç Girişimci Karşılaştırması
              </h3>
              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold">
                      <th className="py-2">Kalem</th>
                      <th className="py-2">Normal Mükellef</th>
                      <th className="py-2 text-emerald-600 dark:text-emerald-400 font-bold">Genç Girişimci</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                    <tr>
                      <td className="py-2">Vergi Matrahı</td>
                      <td className="py-2">{result.annualGrossProfit.toLocaleString('tr-TR')} TL</td>
                      <td className="py-2 text-emerald-600 font-semibold">
                        {result.taxableIncomeWithIncentive.toLocaleString('tr-TR')} TL
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2">Ödenecek Gelir Vergisi</td>
                      <td className="py-2 text-rose-500 font-semibold">
                        {result.standardIncomeTax.toLocaleString('tr-TR')} TL
                      </td>
                      <td className="py-2 text-emerald-600 font-semibold">
                        {result.incentivizedIncomeTax.toLocaleString('tr-TR')} TL
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2">Yıllık Bağkur Primi</td>
                      <td className="py-2 text-rose-500 font-semibold">
                        {(currentMonthlyBagkur * 12).toLocaleString('tr-TR')} TL
                      </td>
                      <td className="py-2 text-emerald-600 font-semibold">
                        {includeBagkur ? '0 TL (Devlet Öder)' : `${(currentMonthlyBagkur * 12).toLocaleString('tr-TR')} TL`}
                      </td>
                    </tr>
                    <tr className="font-bold text-sm">
                      <td className="py-2.5 text-slate-900 dark:text-white">Net Ele Geçen Kazanç</td>
                      <td className="py-2.5 text-slate-500">
                        {result.standardNetIncome.toLocaleString('tr-TR')} TL
                      </td>
                      <td className="py-2.5 text-emerald-600 dark:text-emerald-400">
                        {result.incentivizedNetIncome.toLocaleString('tr-TR')} TL
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Requirements & Legislation Notes */}
        <div className="p-6 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FaShieldAlt className="w-4 h-4 text-brand-primary" />
            Genç Girişimci Teşviki Şartları (193 s. GVK Mükerrer m.20/A)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600 dark:text-slate-400">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 space-y-1.5">
              <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <FaCheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                18 - 29 Yaş Şartı
              </div>
              <p>İşe başlama tarihi itibarıyla 18 yaşını doldurmuş ve 29 yaşını doldurmamış olmak gereklidir.</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 space-y-1.5">
              <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <FaCheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                İlk Kez Mükellefiyet
              </div>
              <p>İlk defa gelir vergisi mükellefi olmak (daha önce şahıs veya adi ortaklık şirketi bulunmamak).</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 space-y-1.5">
              <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <FaCheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                İşin Başında Bilfiil Bulunmak
              </div>
              <p>Kendi işinde bilfiil çalışmak veya işi sevk ve idare etmek (işçi çalıştırmak şartı bozmaz).</p>
            </div>
          </div>
        </div>

        {/* Developer API Section */}
        <div className="p-6 sm:p-8 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FaMoneyBillWave className="w-4 h-4 text-brand-primary" />
                Geliştiriciler İçin REST API Entegrasyonu
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Finansal planlama veya girişimcilik SaaS platformunuzda otomatik vergi simülasyonu için:
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
