'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  FaPlaneDeparture,
  FaCheckCircle,
  FaExclamationTriangle,
  FaCopy,
  FaCheck,
  FaInfoCircle,
  FaFileCode,
  FaBoxes,
  FaMoneyBillWave,
  FaTruckMoving,
  FaCalculator,
  FaPercent,
  FaShieldAlt,
} from 'react-icons/fa';
import {
  evaluateMicroExport,
  ETGB_LIMITS,
  AUTHORIZED_ETGB_CARRIERS,
  type MicroExportInput,
} from '@/modules/tr-api/microExportEtgb';

export default function MicroExportEtgbToolClient() {
  const [weightKg, setWeightKg] = useState<number>(15);
  const [invoiceAmount, setInvoiceAmount] = useState<number>(2200);
  const [currency, setCurrency] = useState<'EUR' | 'USD' | 'TRY' | 'GBP'>('EUR');
  const [costOfGoodsSold, setCostOfGoodsSold] = useState<number>(1200);
  const [costVatRate, setCostVatRate] = useState<10 | 20 | 1 | 0>(20);
  const [profitMargin, setProfitMargin] = useState<number>(30);
  const [qualifiesGvk89, setQualifiesGvk89] = useState<boolean>(true);
  const [eurRate, setEurRate] = useState<number>(38.5);
  const [usdToEur, setUsdToEur] = useState<number>(0.92);
  const [showAdvancedRates, setShowAdvancedRates] = useState<boolean>(false);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const evaluation = useMemo(() => {
    return evaluateMicroExport({
      weightKg,
      invoiceAmount,
      currency,
      eurExchangeRate: eurRate,
      usdToEurRate: usdToEur,
      costOfGoodsSold,
      costVatRate,
      estimatedProfitMarginPercent: profitMargin,
      qualifiesForGvk89Exemption: qualifiesGvk89,
    });
  }, [
    weightKg,
    invoiceAmount,
    currency,
    eurRate,
    usdToEur,
    costOfGoodsSold,
    costVatRate,
    profitMargin,
    qualifiesGvk89,
  ]);

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const curlExample = `curl -X POST https://noktanyus.com/api/v1/commerce/micro-export-etgb \\
  -H "Content-Type: application/json" \\
  -d '{
    "weightKg": ${weightKg},
    "invoiceAmount": ${invoiceAmount},
    "currency": "${currency}",
    "costOfGoodsSold": ${costOfGoodsSold},
    "costVatRate": ${costVatRate},
    "qualifiesForGvk89Exemption": ${qualifiesGvk89}
  }'`;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-slate-400">
          <Link href="/araclar" className="hover:text-indigo-400 transition-colors">
            Araçlar
          </Link>
          <span>/</span>
          <span className="text-slate-200">E-İhracat / Mikro İhracat (ETGB)</span>
        </div>

        {/* Hero Title */}
        <div className="border-b border-slate-800 pb-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl text-white shadow-lg shadow-indigo-500/20">
              <FaPlaneDeparture className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                E-İhracat & Mikro İhracat (ETGB) Uygunluk ve KDV İadesi Hesaplama
              </h1>
              <p className="text-slate-400 mt-1 text-sm sm:text-base">
                4458 sayılı Gümrük Kanunu 300 kg / 15.000 € ETGB limit denetimi, 301 KDV istisnası, nakden KDV İadesi ve GVK m.89/16 %50 kazanç indirimi simülatörü.
              </p>
            </div>
          </div>
        </div>

        {/* Main Grid: Inputs vs Results */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Form: 5 Cols */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-slate-800/80 backdrop-blur border border-slate-700/80 rounded-2xl p-6 shadow-xl space-y-5">
              <h2 className="text-base font-semibold text-white flex items-center gap-2 border-b border-slate-700/60 pb-3">
                <FaBoxes className="text-indigo-400" /> Gönderi ve Fatura Bilgileri
              </h2>

              {/* Weight */}
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <label className="text-slate-300 font-medium">Paket Brüt Ağırlığı</label>
                  <span className="text-xs text-indigo-400 font-mono">Azami: 300 kg</span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min="0.1"
                    step="0.5"
                    value={weightKg}
                    onChange={(e) => setWeightKg(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-indigo-500 pr-12"
                  />
                  <span className="absolute right-3.5 top-2.5 text-slate-400 text-sm font-medium">kg</span>
                </div>
              </div>

              {/* Invoice Amount & Currency */}
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <label className="text-slate-300 font-medium">Fatura Tutarı & Para Birimi</label>
                  <span className="text-xs text-indigo-400 font-mono">Azami: 15.000 €</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={invoiceAmount}
                    onChange={(e) => setInvoiceAmount(parseFloat(e.target.value) || 0)}
                    className="col-span-2 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-indigo-500"
                    placeholder="Tutar"
                  />
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as any)}
                    className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-medium focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="EUR">EUR (€)</option>
                    <option value="USD">USD ($)</option>
                    <option value="TRY">TRY (₺)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
              </div>

              {/* COGS (Cost of goods sold for VAT refund) */}
              <div className="border-t border-slate-700/60 pt-4">
                <div className="flex justify-between text-sm mb-1.5">
                  <label className="text-slate-300 font-medium flex items-center gap-1.5">
                    <FaMoneyBillWave className="text-emerald-400 text-xs" /> Malın Tedarik / Üretim Maliyeti
                  </label>
                  <span className="text-xs text-emerald-400">KDV Hariç</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="number"
                    min="0"
                    value={costOfGoodsSold}
                    onChange={(e) => setCostOfGoodsSold(parseFloat(e.target.value) || 0)}
                    className="col-span-2 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-emerald-500"
                    placeholder="Maliyet"
                  />
                  <select
                    value={costVatRate}
                    onChange={(e) => setCostVatRate(parseInt(e.target.value) as any)}
                    className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2.5 text-white text-xs font-medium focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value={20}>KDV %20</option>
                    <option value={10}>KDV %10</option>
                    <option value={1}>KDV %1</option>
                    <option value={0}>KDV %0</option>
                  </select>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Yurtiçinde alırken ödediğiniz KDV, ihracat sonrası GİB’den iade alınabilir.
                </p>
              </div>

              {/* Profit margin & GVK 89/16 */}
              <div className="border-t border-slate-700/60 pt-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <label className="text-slate-300 font-medium">Tahmini Kâr Marjı</label>
                  <span className="text-xs text-indigo-400 font-mono">%{profitMargin}</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="80"
                  step="5"
                  value={profitMargin}
                  onChange={(e) => setProfitMargin(parseInt(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />

                <label className="flex items-start gap-2.5 text-sm text-slate-300 cursor-pointer bg-slate-900/60 p-3 rounded-xl border border-slate-700/60">
                  <input
                    type="checkbox"
                    checked={qualifiesGvk89}
                    onChange={(e) => setQualifiesGvk89(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-800 border-slate-600"
                  />
                  <span>
                    <strong className="text-white block text-xs">GVK m.89/1-16 İhracat Kazanç İndirimi</strong>
                    <span className="text-xs text-slate-400">
                      Gerçek kişi şahıs şirketi mükellefleri mikro ihracat kazancının %50’sini gelir vergisinden düşebilir.
                    </span>
                  </span>
                </label>
              </div>

              {/* Advanced Exchange Rates Toggle */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdvancedRates(!showAdvancedRates)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                >
                  {showAdvancedRates ? '▲ Kurları Gizle' : '▼ Özel Parite & Kurları Düzenle'}
                </button>
                {showAdvancedRates && (
                  <div className="grid grid-cols-2 gap-3 mt-3 p-3 bg-slate-900/80 rounded-xl border border-slate-700/60 text-xs">
                    <div>
                      <label className="text-slate-400 block mb-1">EUR / TRY Kuru</label>
                      <input
                        type="number"
                        step="0.1"
                        value={eurRate}
                        onChange={(e) => setEurRate(parseFloat(e.target.value) || 1)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">USD → EUR Çarpanı</label>
                      <input
                        type="number"
                        step="0.01"
                        value={usdToEur}
                        onChange={(e) => setUsdToEur(parseFloat(e.target.value) || 1)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Carriers Widget */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-lg space-y-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <FaTruckMoving className="text-amber-400" /> Yetkili Hızlı Kargo Operatörleri
              </h3>
              <p className="text-xs text-slate-400">
                Mikro ihracat yalnızca Ticaret Bakanlığı yetkili hızlı kargo taşıyıcıları üzerinden ETGB ile yapılabilir:
              </p>
              <div className="space-y-2">
                {AUTHORIZED_ETGB_CARRIERS.slice(0, 4).map((c) => (
                  <div
                    key={c.code}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-700/50 text-xs"
                  >
                    <span className="font-medium text-slate-200">{c.name}</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-[10px]">
                      ETGB Destekler
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Results: 7 Cols */}
          <div className="lg:col-span-7 space-y-6">
            {/* Eligibility Banner */}
            <div
              className={`rounded-2xl p-6 border shadow-xl transition-all ${
                evaluation.isEligible
                  ? 'bg-gradient-to-br from-emerald-950/40 via-slate-800/80 to-slate-900 border-emerald-500/40'
                  : 'bg-gradient-to-br from-rose-950/40 via-slate-800/80 to-slate-900 border-rose-500/40'
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`p-3 rounded-xl shrink-0 ${
                    evaluation.isEligible ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                  }`}
                >
                  {evaluation.isEligible ? (
                    <FaCheckCircle className="w-8 h-8" />
                  ) : (
                    <FaExclamationTriangle className="w-8 h-8" />
                  )}
                </div>
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                        evaluation.isEligible
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      {evaluation.status === 'MICRO_EXPORT_ETGB'
                        ? '✅ Mikro İhracat (ETGB) Uygun'
                        : '⚠️ Detaylı Gümrük Beyannamesi Zorunlu'}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      Kod: {evaluation.vatExemptionCode} (KDV %0)
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white">
                    {evaluation.isEligible ? 'Gönderi ETGB Kapsamında İhraç Edilebilir' : 'Yasal Mikro İhracat Sınırı Aşıldı'}
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed">{evaluation.statusMessageTr}</p>
                </div>
              </div>

              {/* Progress bars for Limits */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-5 border-t border-slate-700/60">
                {/* Weight Limit Meter */}
                <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-700/50 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Ağırlık Kontrolü</span>
                    <span className={`font-mono font-bold ${evaluation.isWeightValid ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {evaluation.weightKg} kg / {evaluation.weightLimitKg} kg
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        evaluation.isWeightValid ? 'bg-indigo-500' : 'bg-rose-500'
                      }`}
                      style={{
                        width: `${Math.min(100, (evaluation.weightKg / evaluation.weightLimitKg) * 100)}%`,
                      }}
                    />
                  </div>
                  <div className="text-[11px] text-slate-400 flex justify-between">
                    <span>Brüt Ağırlık</span>
                    <span>Kalan: {Math.max(0, evaluation.weightLimitKg - evaluation.weightKg).toFixed(1)} kg</span>
                  </div>
                </div>

                {/* Amount Limit Meter */}
                <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-700/50 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Tutar Kontrolü (Avro)</span>
                    <span className={`font-mono font-bold ${evaluation.isAmountValid ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {evaluation.amountInEur.toLocaleString('tr-TR')} € / {evaluation.eurLimit.toLocaleString('tr-TR')} €
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        evaluation.isAmountValid ? 'bg-indigo-500' : 'bg-rose-500'
                      }`}
                      style={{
                        width: `${Math.min(100, (evaluation.amountInEur / evaluation.eurLimit) * 100)}%`,
                      }}
                    />
                  </div>
                  <div className="text-[11px] text-slate-400 flex justify-between">
                    <span>Avro Değeri</span>
                    <span>Kalan: {Math.max(0, evaluation.eurLimit - evaluation.amountInEur).toLocaleString('tr-TR')} €</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Benefits: VAT Refund & GVK 89/16 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* VAT Refund Card */}
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 uppercase">
                    <FaMoneyBillWave /> Tahmini KDV İadesi
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-xs">
                    KDV %0 İstisnası
                  </span>
                </div>
                <div className="text-2xl font-bold text-white font-mono">
                  {evaluation.potentialVatRefund.estimatedRefundAmount.toLocaleString('tr-TR')}{' '}
                  <span className="text-sm font-sans font-normal text-slate-400">
                    {evaluation.potentialVatRefund.currency}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {evaluation.potentialVatRefund.explanationTr}
                </p>
                <div className="pt-2 text-[11px] text-slate-400 border-t border-slate-700/50">
                  Resmi Kod: <strong>301 (3065 s.K. m.11/1-a)</strong>
                </div>
              </div>

              {/* Income Tax Incentive Card */}
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-indigo-400 flex items-center gap-1.5 uppercase">
                    <FaPercent /> GVK 89/1-16 Teşviki
                  </span>
                  <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono text-xs">
                    %50 Kazanç İstisnası
                  </span>
                </div>
                <div className="text-2xl font-bold text-white font-mono">
                  {evaluation.incomeTaxIncentiveGvk89.exemptProfitAmount.toLocaleString('tr-TR')}{' '}
                  <span className="text-sm font-sans font-normal text-slate-400">
                    {currency} Muaf Kazanç
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {evaluation.incomeTaxIncentiveGvk89.explanationTr}
                </p>
                <div className="pt-2 text-[11px] text-slate-400 border-t border-slate-700/50">
                  Vergiye Tabi Kalan Kâr:{' '}
                  <strong className="text-white">
                    {evaluation.incomeTaxIncentiveGvk89.taxableProfitAmount.toLocaleString('tr-TR')} {currency}
                  </strong>
                </div>
              </div>
            </div>

            {/* Checklist */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-lg space-y-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <FaShieldAlt className="text-indigo-400" /> E-İhracat Zorunlu Gümrük & Fatura Kontrol Listesi
              </h3>
              <div className="space-y-2">
                {evaluation.customsChecklist.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-900/60 border border-slate-700/50 rounded-xl flex items-start gap-3 text-xs"
                  >
                    <span className="mt-0.5 p-1 rounded-full bg-indigo-500/20 text-indigo-400 shrink-0">
                      <FaCheck className="w-2.5 h-2.5" />
                    </span>
                    <div>
                      <strong className="text-white font-medium block">{item.item}</strong>
                      <span className="text-slate-400">{item.description}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* UBL XML & API Snippets Tabs */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
                <span className="text-sm font-semibold text-white flex items-center gap-2">
                  <FaFileCode className="text-purple-400" /> UBL-TR 2.1 İhracat Fatura Parçacığı (XML)
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(evaluation.ublExportSnippet, 'ubl')}
                  className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  {copiedSection === 'ubl' ? <FaCheck className="text-emerald-400" /> : <FaCopy />}
                  {copiedSection === 'ubl' ? 'Kopyalandı' : 'Kopyala'}
                </button>
              </div>
              <pre className="bg-slate-950 p-4 rounded-xl text-xs font-mono text-purple-300 overflow-x-auto border border-slate-800">
                {evaluation.ublExportSnippet}
              </pre>

              <div className="flex items-center justify-between border-b border-slate-700/60 pb-3 pt-3">
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
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6 mt-12">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FaInfoCircle className="text-indigo-400" /> Mikro İhracat (ETGB) Hakkında Sıkça Sorulan Sorular
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-slate-300">
            <div className="space-y-2 bg-slate-900/60 p-4 rounded-xl border border-slate-700/50">
              <h3 className="font-semibold text-white">1. Mikro İhracat (ETGB) nedir?</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Brüt ağırlığı 300 kg ve mal bedeli 15.000 Avro’yu aşmayan, ticari amaçla yapılan ihracatların yetkili hızlı kargo operatörleri (DHL, UPS, FedEx vb.) tarafından gümrük müşaviri ücreti ve harç ödenmeksizin elektronik ortamda (ETGB) beyan edilmesidir.
              </p>
            </div>

            <div className="space-y-2 bg-slate-900/60 p-4 rounded-xl border border-slate-700/50">
              <h3 className="font-semibold text-white">2. KDV %0 kesilince KDV İadesi nasıl alınır?</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                3065 sayılı KDV Kanunu m.11/1-a uyarınca mal ihracatı KDV’den istisnadır. İhraç ettiğiniz malı satın alırken veya imal ederken ödediğiniz KDV (Yüklenilen KDV), kargo firmasından alınan ETGB dökümü ile GİB İnternet Vergi Dairesi üzerinden nakden veya vergi/SGK borçlarına mahsuben iade talep edilebilir.
              </p>
            </div>

            <div className="space-y-2 bg-slate-900/60 p-4 rounded-xl border border-slate-700/50">
              <h3 className="font-semibold text-white">3. GVK m.89/1-16 %50 kazanç indirimi nedir?</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                193 sayılı Gelir Vergisi Kanunu uyarınca, ETGB ile mikro ihracat yapan gerçek kişi şahıs şirketleri, istihdam şartlarını sağlayarak ihracattan elde ettikleri ticari kârın %50’sini yıllık gelir vergisi beyannamesinde indirim konusu yaparak muazzam bir vergi avantajı sağlarlar.
              </p>
            </div>

            <div className="space-y-2 bg-slate-900/60 p-4 rounded-xl border border-slate-700/50">
              <h3 className="font-semibold text-white">4. Limit aşılırsa ne olur?</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Gönderi 300 kg veya 15.000 € limitini aştığında mikro ihracat kapsamından çıkar. İhracatçı Birlikleri onayı, Gümrük Müşavirliği yetkilendirmesi ve standart Detaylı İhracat Gümrük Beyannamesi açılması gerekir.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
