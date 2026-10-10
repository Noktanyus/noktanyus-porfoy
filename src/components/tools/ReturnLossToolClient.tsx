'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  FaArrowLeft,
  FaCalculator,
  FaUndoAlt,
  FaExclamationTriangle,
  FaCheckCircle,
  FaInfoCircle,
  FaCopy,
  FaCheck,
  FaBoxes,
  FaShippingFast,
  FaPercentage,
  FaChartLine,
} from 'react-icons/fa';
import TrackRecentTool from '@/components/tools/TrackRecentTool';
import {
  calculateReturnLoss,
  SECTOR_RETURN_PRESETS,
  type ReturnLossInput,
  type SectorReturnPreset,
} from '@/modules/tr-api/returnLoss';

export default function ReturnLossToolClient() {
  const [salePrice, setSalePrice] = useState<number>(450);
  const [costPrice, setCostPrice] = useState<number>(180);
  const [commissionRate, setCommissionRate] = useState<number>(21);
  const [returnRate, setReturnRate] = useState<number>(20);
  const [shippingOutbound, setShippingOutbound] = useState<number>(38);
  const [shippingReturn, setShippingReturn] = useState<number>(38);
  const [packagingCost, setPackagingCost] = useState<number>(8);
  const [damagedRate, setDamagedRate] = useState<number>(5);
  const [marketplaceFee, setMarketplaceFee] = useState<number>(0);
  const [monthlyOrders, setMonthlyOrders] = useState<number>(250);

  const [copied, setCopied] = useState(false);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('');

  const handleApplyPreset = (preset: SectorReturnPreset) => {
    setSelectedPresetId(preset.id);
    setReturnRate(preset.typicalReturnRate);
    setDamagedRate(preset.damagedLossRate);
  };

  const calculationInput: ReturnLossInput = useMemo(() => {
    return {
      salePrice: Number(salePrice) || 0,
      costPrice: Number(costPrice) || 0,
      commissionRate: Number(commissionRate) || 0,
      returnRate: Number(returnRate) || 0,
      shippingOutboundCost: Number(shippingOutbound) || 0,
      shippingReturnCost: Number(shippingReturn) || 0,
      packagingCost: Number(packagingCost) || 0,
      damagedLossRate: Number(damagedRate) || 0,
      marketplaceReturnFee: Number(marketplaceFee) || 0,
      monthlyOrderCount: Number(monthlyOrders) || 0,
    };
  }, [
    salePrice,
    costPrice,
    commissionRate,
    returnRate,
    shippingOutbound,
    shippingReturn,
    packagingCost,
    damagedRate,
    marketplaceFee,
    monthlyOrders,
  ]);

  const result = useMemo(() => {
    return calculateReturnLoss(calculationInput);
  }, [calculationInput]);

  const curlCommand = useMemo(() => {
    const payload = JSON.stringify(calculationInput, null, 2);
    return `curl -X POST https://noktanyus.com/api/v1/commerce/return-loss \\
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
      <TrackRecentTool slug="e-ticaret-iade-zarari-hesaplama" title="İade Zararı ve Kârlılık Hesaplayıcı" />

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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <FaUndoAlt className="w-3 h-3" />
            <span>Trendyol, Hepsiburada, Amazon TR & E-Ticaret Finans Motoru</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white">
            E-Ticaret İade Zararı & Gerçek Kâr Marjı Hesaplama
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base max-w-3xl">
            İadeler e-ticaret satıcılarının en büyük gizli kâr katilidir. Çift yönlü kargo, ziyan olan ambalaj ve
            yıpranan ürün maliyetini hesaplayarak sipariş başına <strong>efektif net kârınızı</strong> ve operasyonunuzun{' '}
            <strong>başa baş iade sınırını (break-even limit)</strong> simüle edin.
          </p>
        </header>

        {/* Sector Presets */}
        <div className="p-4 sm:p-6 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-sm space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <FaPercentage className="w-3.5 h-3.5 text-brand-primary" />
              Sektörel İade & Hasar Oranı Önayarları
            </h2>
            <span className="text-xs text-slate-400">Tek tıkla uygulayın</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {SECTOR_RETURN_PRESETS.map((preset) => {
              const isSelected = selectedPresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => handleApplyPreset(preset)}
                  className={`p-2.5 rounded-xl text-left border transition-all text-xs ${
                    isSelected
                      ? 'border-brand-primary bg-brand-primary/10 text-brand-primary font-semibold'
                      : 'border-slate-200 dark:border-slate-800 hover:border-brand-primary/40 bg-white/50 dark:bg-slate-950/50 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="font-medium truncate">{preset.title}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    İade: %{preset.typicalReturnRate} | Hasar: %{preset.damagedLossRate}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Grid: Form and Results */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Inputs Section */}
          <div className="lg:col-span-6 p-6 sm:p-8 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xl backdrop-blur-sm space-y-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
              <FaCalculator className="w-4 h-4 text-brand-primary" />
              Birim Satış & İade Parametreleri
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Satış Fiyatı (TL, KDV Dahil)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={salePrice}
                  onChange={(e) => setSalePrice(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Ürün Alış / Maliyeti (TL)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={costPrice}
                  onChange={(e) => setCostPrice(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Komisyon Oranı (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-rose-600 dark:text-rose-400 mb-1">
                  Gerçekleşen İade Oranı (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={returnRate}
                  onChange={(e) => setReturnRate(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-rose-300 dark:border-rose-700 bg-rose-50/30 dark:bg-rose-950/20 text-slate-900 dark:text-white text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Gidiş Kargo Ücreti (TL)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={shippingOutbound}
                  onChange={(e) => setShippingOutbound(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  İade Dönüş Kargo Ücreti (TL)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={shippingReturn}
                  onChange={(e) => setShippingReturn(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Ambalaj & Kutu Sarfı (TL)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={packagingCost}
                  onChange={(e) => setPackagingCost(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  İade Ürün Hasar/Amortismanı (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={damagedRate}
                  onChange={(e) => setDamagedRate(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Aylık Toplam Sipariş Adedi (Projeksiyon için)
                </label>
                <input
                  type="number"
                  min="1"
                  step="10"
                  value={monthlyOrders}
                  onChange={(e) => setMonthlyOrders(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm"
                />
              </div>
            </div>
          </div>

          {/* Results Summary & KPI Cards */}
          <div className="lg:col-span-6 space-y-6">
            {/* Status Alert Banner */}
            <div
              className={`p-5 rounded-2xl border ${
                result.evaluation.severity === 'danger'
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-900 dark:text-rose-200'
                  : result.evaluation.severity === 'warning'
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200'
              }`}
            >
              <div className="flex items-start gap-3">
                {result.evaluation.severity === 'danger' ? (
                  <FaExclamationTriangle className="w-5 h-5 text-rose-500 mt-0.5 shrink-0" />
                ) : result.evaluation.severity === 'warning' ? (
                  <FaExclamationTriangle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                ) : (
                  <FaCheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
                )}
                <div>
                  <h4 className="font-bold text-sm sm:text-base">{result.evaluation.title}</h4>
                  <p className="text-xs sm:text-sm mt-1 opacity-90 leading-relaxed">
                    {result.evaluation.description}
                  </p>
                </div>
              </div>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  İadesiz Satış Net Kârı
                </span>
                <span className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-1 block">
                  {result.successfulNetProfit.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">
                  Marj: %{result.successfulProfitMarginPercent}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 shadow-sm">
                <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider block">
                  Tek İade Başına Net Zarar
                </span>
                <span className="text-xl sm:text-2xl font-extrabold text-rose-600 dark:text-rose-400 mt-1 block">
                  -{result.singleReturnDirectLoss.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">
                  Gidiş+Dönüş Kargo, Ambalaj & Değer Kaybı
                </span>
              </div>

              <div
                className={`p-4 rounded-2xl border shadow-sm ${
                  result.effectiveNetProfitPerOrder >= 0
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50'
                    : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50'
                }`}
              >
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 block">
                  Efektif Ortalama Kâr (Sipariş Başı)
                </span>
                <span
                  className={`text-xl sm:text-2xl font-extrabold mt-1 block ${
                    result.effectiveNetProfitPerOrder >= 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {result.effectiveNetProfitPerOrder.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">
                  Efektif Marj: %{result.effectiveProfitMarginPercent}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 shadow-sm">
                <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
                  Başa Baş İade Limiti
                </span>
                <span className="text-xl sm:text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1 block">
                  %{result.breakEvenReturnRatePercent}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">
                  Güvenlik Marjı: {result.safetyMarginPoints > 0 ? `+${result.safetyMarginPoints}` : result.safetyMarginPoints} puan
                </span>
              </div>
            </div>

            {/* Visual Break-Even Bar */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-slate-600 dark:text-slate-400">İade Oranı vs Başa Baş Sınırı</span>
                <span>
                  Mevcut: <strong className="text-rose-600">%{returnRate}</strong> / Eşik: <strong>%{result.breakEvenReturnRatePercent}</strong>
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden relative">
                <div
                  className={`h-full transition-all ${
                    returnRate > result.breakEvenReturnRatePercent
                      ? 'bg-rose-500'
                      : returnRate > result.breakEvenReturnRatePercent * 0.75
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, (returnRate / (result.breakEvenReturnRatePercent || 1)) * 100)}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {returnRate > result.breakEvenReturnRatePercent
                  ? '⚠️ İade oranınız başa baş sınırını aştığı için her siparişte sermayeden zarar yazmaktasınız.'
                  : `İade oranınız %${result.breakEvenReturnRatePercent} seviyesine ulaşana kadar operasyon kârda kalacaktır.`}
              </p>
            </div>

            {/* Monthly Projection Table */}
            {result.monthlyProjection && (
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <FaChartLine className="w-3.5 h-3.5 text-brand-primary" />
                  Aylık Operasyonel Projeksiyon ({result.monthlyProjection.orderCount} Sipariş)
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950">
                    <span className="text-[10px] text-slate-400 uppercase block">Tahmini İade</span>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      {result.monthlyProjection.estimatedReturnsCount} Adet
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950">
                    <span className="text-[10px] text-slate-400 uppercase block">Toplam Ciro</span>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      {result.monthlyProjection.totalGrossRevenue.toLocaleString('tr-TR')} TL
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                    <span className="text-[10px] uppercase block">Toplam İade Zararı</span>
                    <span className="text-sm font-bold">
                      -{result.monthlyProjection.totalDirectReturnLoss.toLocaleString('tr-TR')} TL
                    </span>
                  </div>
                  <div className={`p-2.5 rounded-xl font-bold ${
                    result.monthlyProjection.totalNetProfit >= 0
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                  }`}>
                    <span className="text-[10px] uppercase block">Net Aylık Kazanç</span>
                    <span className="text-sm">
                      {result.monthlyProjection.totalNetProfit.toLocaleString('tr-TR')} TL
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Developer API Section */}
        <div className="p-6 sm:p-8 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FaShippingFast className="w-4 h-4 text-brand-primary" />
                Geliştiriciler İçin REST API Entegrasyonu
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                E-ticaret ERP veya pazaryeri entegratör yazılımınızda otomatik kârlılık kontrolü için:
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
