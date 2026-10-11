'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  FaUserTie,
  FaCheckCircle,
  FaExclamationTriangle,
  FaCalculator,
  FaMoneyBillWave,
  FaUsers,
  FaPercent,
  FaPiggyBank,
  FaShieldAlt,
  FaCopy,
  FaCheck,
  FaInfoCircle,
} from 'react-icons/fa';
import {
  calculateSgkIncentive,
  SGK_OFFICIAL_CONSTANTS,
  type SgkIncentiveInput,
} from '@/modules/tr-api/sgkIncentive';

export default function SgkIncentiveToolClient() {
  const [grossSalary, setGrossSalary] = useState<number>(20002.5);
  const [employeeCount, setEmployeeCount] = useState<number>(5);
  const [apply5Points, setApply5Points] = useState<boolean>(true);
  const [applyMinWageSupport, setApplyMinWageSupport] = useState<boolean>(true);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const result = useMemo(() => {
    return calculateSgkIncentive({
      grossSalaryPerEmployee: grossSalary,
      employeeCount,
      apply5PointsDiscount: apply5Points,
      applyMinimumWageSupport: applyMinWageSupport,
    });
  }, [grossSalary, employeeCount, apply5Points, applyMinWageSupport]);

  const setPreset = (gross: number, count: number) => {
    setGrossSalary(gross);
    setEmployeeCount(count);
  };

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const curlExample = `curl -X POST https://noktanyus.com/api/v1/labor/sgk-incentive \\
  -H "Content-Type: application/json" \\
  -d '{
    "grossSalaryPerEmployee": ${grossSalary},
    "employeeCount": ${employeeCount},
    "apply5PointsDiscount": ${apply5Points},
    "applyMinimumWageSupport": ${applyMinWageSupport}
  }'`;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-slate-400">
          <Link href="/araclar" className="hover:text-indigo-400 transition-colors">
            Araçlar
          </Link>
          <span>/</span>
          <span className="text-slate-200">SGK Teşvik & İşveren Maliyeti</span>
        </div>

        {/* Hero Title */}
        <div className="border-b border-slate-800 pb-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="p-2.5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl text-white shadow-lg shadow-emerald-500/20">
              <FaPiggyBank className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                SGK %5 Puan Hazine Teşviki & İşveren Maliyeti Hesaplama
              </h1>
              <p className="text-slate-400 mt-1 text-sm sm:text-base">
                5510 sayılı Kanun m.81/ı 5 puanlık Hazine prim indirimi (%20.5 → %15.5), 700 TL asgari ücret desteği ve şirket bordro tasarrufu motoru.
              </p>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-slate-800 text-xs">
            <span className="text-slate-400 font-medium">Hızlı Kadro Senaryoları:</span>
            <button
              type="button"
              onClick={() => setPreset(20002.5, 1)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors"
            >
              👤 1 Çalışan - Asgari Ücret (20.002,50 ₺)
            </button>
            <button
              type="button"
              onClick={() => setPreset(35000, 5)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors"
            >
              👥 5 Çalışan - Orta Kadro (35.000 ₺)
            </button>
            <button
              type="button"
              onClick={() => setPreset(45000, 20)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors"
            >
              🏢 20 Çalışan - Kurumsal (45.000 ₺)
            </button>
          </div>
        </div>

        {/* Main Grid: Form vs Results */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Form: 5 Cols */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-slate-800/80 backdrop-blur border border-slate-700/80 rounded-2xl p-6 shadow-xl space-y-5">
              <h2 className="text-base font-semibold text-white flex items-center gap-2 border-b border-slate-700/60 pb-3">
                <FaCalculator className="text-emerald-400" /> Bordro & Kadro Parametreleri
              </h2>

              {/* Gross Salary per Employee */}
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <label className="text-slate-300 font-medium">Aylık Brüt Ücret (Kişi Başı)</label>
                  <span className="text-xs text-emerald-400 font-mono">Taban: 20.002,50 ₺</span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    step="500"
                    value={grossSalary}
                    onChange={(e) => setGrossSalary(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-emerald-500 pr-12"
                  />
                  <span className="absolute right-3.5 top-2.5 text-slate-400 text-sm font-medium">₺</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  SGK Tavanı: 150.018,75 ₺ (Aşan tutardan prim kesilmez).
                </p>
              </div>

              {/* Employee Count */}
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <label className="text-slate-300 font-medium">Çalışan Sayısı (Kişi)</label>
                  <span className="text-xs text-indigo-400 font-mono">{employeeCount} Çalışan</span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={employeeCount}
                    onChange={(e) => setEmployeeCount(parseInt(e.target.value) || 1)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-indigo-500 pr-12"
                  />
                  <span className="absolute right-3.5 top-2.5 text-slate-400 text-sm font-medium">Kişi</span>
                </div>
              </div>

              {/* 5-points discount switch */}
              <div className="border-t border-slate-700/60 pt-4 space-y-3">
                <label className="flex items-start gap-2.5 text-sm text-slate-300 cursor-pointer bg-slate-900/60 p-3 rounded-xl border border-slate-700/60">
                  <input
                    type="checkbox"
                    checked={apply5Points}
                    onChange={(e) => setApply5Points(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-slate-800 border-slate-600"
                  />
                  <span>
                    <strong className="text-white block text-xs">
                      5510 m.81/ı 5 Puanlık Hazine İndirimi
                    </strong>
                    <span className="text-xs text-slate-400">
                      SGK işveren payı %20.5 yerine %15.5 olarak tahakkuk eder (%5 Hazine desteği).
                    </span>
                  </span>
                </label>

                {/* Minimum wage support switch */}
                <label className="flex items-start gap-2.5 text-sm text-slate-300 cursor-pointer bg-slate-900/60 p-3 rounded-xl border border-slate-700/60">
                  <input
                    type="checkbox"
                    checked={applyMinWageSupport}
                    onChange={(e) => setApplyMinWageSupport(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-slate-800 border-slate-600"
                  />
                  <span>
                    <strong className="text-white block text-xs">
                      Asgari Ücret Desteği (700 ₺ / Çalışan)
                    </strong>
                    <span className="text-xs text-slate-400">
                      Çalışan başına aylık 700 TL işveren SGK prim borcundan mahsup edilir.
                    </span>
                  </span>
                </label>
              </div>
            </div>

            {/* Legal compliance notice */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-lg space-y-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <FaShieldAlt className="text-amber-400" /> 5 Puan Teşvikinden Yararlanma Şartları
              </h3>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {result.legalWarning.requirements.map((req, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-0.5">✓</span>
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
              <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-[11px] flex items-start gap-2 mt-2">
                <FaExclamationTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>{result.legalWarning.riskIfDelayed}</span>
              </div>
            </div>
          </div>

          {/* Right Results: 7 Cols */}
          <div className="lg:col-span-7 space-y-6">
            {/* Top Savings Hero Banner */}
            <div className="bg-gradient-to-br from-emerald-950/40 via-slate-800/80 to-slate-900 border border-emerald-500/40 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  🎉 Net İşveren Tasarrufu
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Maliyet Avantajı: %{result.savingsRatioPercent}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <span className="text-xs text-slate-400 block mb-1">Aylık Toplam Tasarruf</span>
                  <div className="text-3xl font-extrabold text-emerald-400 font-mono">
                    {result.monthlyNetSavingsTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                  </div>
                  <span className="text-xs text-slate-400">Her ay işverenin kasasında kalan net nakit</span>
                </div>

                <div>
                  <span className="text-xs text-slate-400 block mb-1">Yıllık Kümülatif Kazanç</span>
                  <div className="text-3xl font-extrabold text-white font-mono">
                    {result.annualNetSavingsTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                  </div>
                  <span className="text-xs text-slate-400">12 aylık toplam şirket tasarrufu</span>
                </div>
              </div>
            </div>

            {/* Cost Comparison Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Standard Cost */}
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-lg space-y-2">
                <span className="text-xs text-slate-400 font-medium">Standart (Teşviksiz) Maliyet</span>
                <div className="text-2xl font-bold text-slate-300 font-mono">
                  {result.standardTotalEmployerCost.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                </div>
                <div className="text-xs text-slate-400">
                  SGK İşveren: %{result.standardEmployerSgkRatePercent} + %2 İşsizlik
                </div>
              </div>

              {/* Incentivized Cost */}
              <div className="bg-slate-800/80 border border-emerald-500/50 rounded-2xl p-5 shadow-lg space-y-2 bg-emerald-950/20">
                <span className="text-xs text-emerald-400 font-medium flex items-center gap-1.5">
                  <FaCheckCircle /> Teşvikli Net Maliyet
                </span>
                <div className="text-2xl font-bold text-emerald-400 font-mono">
                  {result.incentivizedTotalEmployerCost.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                </div>
                <div className="text-xs text-slate-400">
                  SGK İşveren: %{result.appliedEmployerSgkRatePercent} + %2 İşsizlik - Destek
                </div>
              </div>
            </div>

            {/* Itemized Payroll Breakdown */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-xl space-y-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2 border-b border-slate-700/60 pb-3">
                <FaUsers className="text-indigo-400" /> Aylık Bordro & Prim Kalemleri ({result.employeeCount} Kişi)
              </h3>

              <div className="space-y-2.5 text-xs font-mono">
                <div className="flex justify-between p-2.5 bg-slate-900/60 rounded-xl border border-slate-700/50">
                  <span className="text-slate-300 font-sans">Toplam Brüt Ücret Bordrosu</span>
                  <span className="font-bold text-white">
                    {result.totalGrossPayroll.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                  </span>
                </div>

                <div className="flex justify-between p-2.5 bg-slate-900/60 rounded-xl border border-slate-700/50">
                  <span className="text-slate-300 font-sans">
                    SGK İşveren Primi ({result.appliedEmployerSgkRatePercent === 15.5 ? 'Teşvikli %15.5' : 'Standart %20.5'})
                  </span>
                  <span className="font-bold text-slate-200">
                    {result.appliedEmployerSgkCost.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                  </span>
                </div>

                {apply5Points && (
                  <div className="flex justify-between p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/30 text-emerald-300 font-sans">
                    <span>5 Puanlık Hazine İndirimi Tasarrufu</span>
                    <span className="font-mono font-bold">
                      -{result.fivePointsSavingsPerMonth.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                    </span>
                  </div>
                )}

                <div className="flex justify-between p-2.5 bg-slate-900/60 rounded-xl border border-slate-700/50">
                  <span className="text-slate-300 font-sans">İşsizlik Sigortası İşveren Payı (%2)</span>
                  <span className="text-slate-200">
                    {result.employerUnemploymentCost.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                  </span>
                </div>

                {applyMinWageSupport && (
                  <div className="flex justify-between p-2.5 bg-teal-500/10 rounded-xl border border-teal-500/30 text-teal-300 font-sans">
                    <span>Asgari Ücret Desteği (700 ₺ x {result.employeeCount})</span>
                    <span className="font-mono font-bold">
                      -{result.minimumWageSupportTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                    </span>
                  </div>
                )}

                <div className="flex justify-between p-3 bg-slate-950 rounded-xl border border-slate-800 text-sm font-sans font-bold">
                  <span className="text-white">İşverene Net Toplam Maliyet</span>
                  <span className="font-mono text-emerald-400">
                    {result.incentivizedTotalEmployerCost.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                  </span>
                </div>
              </div>
            </div>

            {/* cURL / REST API integration snippet */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
                <span className="text-sm font-semibold text-white flex items-center gap-2">
                  <FaCalculator className="text-emerald-400" /> cURL / REST API Entegrasyonu
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(curlExample, 'curl')}
                  className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  {copiedSection === 'curl' ? <FaCheck className="text-emerald-400" /> : <FaCopy />}
                  {copiedSection === 'curl' ? 'Kopyalandı' : 'Kopyala'}
                </button>
              </div>
              <pre className="bg-slate-950 p-4 rounded-xl text-xs font-mono text-emerald-300 overflow-x-auto border border-slate-800">
                {curlExample}
              </pre>
            </div>
          </div>
        </div>

        {/* Educational Content & FAQ Accordion */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FaInfoCircle className="text-emerald-400" /> 5510 Sayılı Kanun SGK Teşvikleri Hakkında Sıkça Sorulan Sorular
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-slate-300">
            <div className="space-y-2 bg-slate-900/60 p-4 rounded-xl border border-slate-700/50">
              <h3 className="font-semibold text-white">1. 5 Puanlık Prim İndirimi nedir?</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                5510 sayılı Kanun’un 81. maddesinin birinci fıkrasının (ı) bendi uyarınca, özel sektör işverenlerinin malullük, yaşlılık ve ölüm sigortaları primlerinden işveren hissesinin beş puanlık kısmına isabet eden tutar Hazine tarafından karşılanır. Normalde %20,5 olan işveren SGK primi %15,5 olarak ödenir.
              </p>
            </div>

            <div className="space-y-2 bg-slate-900/60 p-4 rounded-xl border border-slate-700/50">
              <h3 className="font-semibold text-white">2. Teşvikten yararlanmak için başvuru gerekir mi?</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Ayrı bir başvuruya gerek yoktur. Şirketin SGK’ya vadesi geçmiş borcu yoksa ve aylık Muhtasar ve Prim Hizmet Beyannamesi (MPHB) 5510 kanun numarası seçilerek yasal süresinde verilip ödenirse sistem indirimi otomatik uygular.
              </p>
            </div>

            <div className="space-y-2 bg-slate-900/60 p-4 rounded-xl border border-slate-700/50">
              <h3 className="font-semibold text-white">3. Asgari Ücret Desteği (700 ₺) nasıl işler?</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                İşverenlerin artan asgari ücret maliyetlerini hafifletmek amacıyla 2024 ve 2025 yıllarında kişi başı aylık 700 TL prim desteği sağlanır. Bu tutar işverenin ödeyeceği aylık SGK prim borcundan doğrudan mahsup edilir.
              </p>
            </div>

            <div className="space-y-2 bg-slate-900/60 p-4 rounded-xl border border-slate-700/50">
              <h3 className="font-semibold text-white">4. Prim borcu 1 gün gecikirse ne olur?</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                SGK primlerinin yasal süresinde ödenmemesi halinde, o ay için 5 puanlık Hazine teşviki iptal edilir; primler %20,5 üzerinden hesaplanır ve gecikme zammı tahakkuk ettirilir.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
