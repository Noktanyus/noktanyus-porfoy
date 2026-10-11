'use client';

import React, { useState, useMemo } from 'react';
import {
  calculateInflationPurchasingPower,
  TUIK_HISTORICAL_CPI_TABLE,
} from '@/modules/tr-api/inflationPurchasingPower';
import {
  FaChartLine,
  FaCoins,
  FaCopy,
  FaCheck,
  FaCalendarAlt,
  FaHistory,
  FaPercent,
  FaInfoCircle,
  FaSlidersH,
  FaFileContract,
} from 'react-icons/fa';

const MONTH_NAMES = [
  'Ocak',
  'Şubat',
  'Mart',
  'Nisan',
  'Mayıs',
  'Haziran',
  'Temmuz',
  'Ağustos',
  'Eylül',
  'Ekim',
  'Kasım',
  'Aralık',
];

export default function InflationPurchasingPowerToolClient() {
  const [initialAmount, setInitialAmount] = useState<number>(100000);
  const [startYear, setStartYear] = useState<number>(2015);
  const [startMonth, setStartMonth] = useState<number>(12);
  const [targetYear, setTargetYear] = useState<number>(2024);
  const [targetMonth, setTargetMonth] = useState<number>(12);

  const [useCustomIndices, setUseCustomIndices] = useState<boolean>(false);
  const [customStartIndex, setCustomStartIndex] = useState<number | undefined>(undefined);
  const [customTargetIndex, setCustomTargetIndex] = useState<number | undefined>(undefined);

  const [copied, setCopied] = useState(false);

  // Available years from CPI table
  const availableYears = useMemo(() => {
    const years = Array.from(new Set(TUIK_HISTORICAL_CPI_TABLE.map((e) => e.year))).sort(
      (a, b) => a - b
    );
    return years;
  }, []);

  const result = useMemo(() => {
    return calculateInflationPurchasingPower({
      initialAmount,
      startYear,
      startMonth,
      targetYear,
      targetMonth,
      customStartIndex: useCustomIndices ? customStartIndex : undefined,
      customTargetIndex: useCustomIndices ? customTargetIndex : undefined,
    });
  }, [
    initialAmount,
    startYear,
    startMonth,
    targetYear,
    targetMonth,
    useCustomIndices,
    customStartIndex,
    customTargetIndex,
  ]);

  const applyPreset = (preset: '1y' | '3y' | '5y' | '10y' | '2003') => {
    setUseCustomIndices(false);
    setTargetYear(2024);
    setTargetMonth(12);
    if (preset === '1y') {
      setStartYear(2023);
      setStartMonth(12);
    } else if (preset === '3y') {
      setStartYear(2021);
      setStartMonth(12);
    } else if (preset === '5y') {
      setStartYear(2019);
      setStartMonth(12);
    } else if (preset === '10y') {
      setStartYear(2014);
      setStartMonth(12);
    } else if (preset === '2003') {
      setStartYear(2003);
      setStartMonth(1);
    }
  };

  const copySummary = () => {
    navigator.clipboard.writeText(result.summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Giriş Paneli */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-800 mb-6 gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <FaCoins className="text-amber-400" />
              TÜFE Enflasyon & Paranın Alım Gücü Hesaplayıcı
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Resmi TÜİK 2003=100 Tüketici Fiyat Endeksi serisi ile geçmiş bir tutarın günümüz alım gücünü hesaplayın.
            </p>
          </div>

          {/* Hızlı Dönem Önayarları */}
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => applyPreset('1y')}
              className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            >
              Son 1 Yıl
            </button>
            <button
              type="button"
              onClick={() => applyPreset('3y')}
              className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            >
              Son 3 Yıl
            </button>
            <button
              type="button"
              onClick={() => applyPreset('5y')}
              className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            >
              Son 5 Yıl
            </button>
            <button
              type="button"
              onClick={() => applyPreset('10y')}
              className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            >
              Son 10 Yıl
            </button>
            <button
              type="button"
              onClick={() => applyPreset('2003')}
              className="px-2.5 py-1 text-xs font-medium rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition"
            >
              2003 Baz Yılı
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Başlangıç Tutarı */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Başlangıç Para Tutarı (TL)
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="1000"
                value={initialAmount}
                onChange={(e) => setInitialAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <span className="absolute right-4 top-3.5 text-slate-400 font-bold">₺</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Geçmiş sözleşme, alacak veya yatırım tutarı</p>
          </div>

          {/* Başlangıç Dönemi */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Başlangıç Tarihi
            </label>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={startYear}
                onChange={(e) => setStartYear(parseInt(e.target.value))}
                className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {availableYears.map((yr) => (
                  <option key={`start-yr-${yr}`} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
              <select
                value={startMonth}
                onChange={(e) => setStartMonth(parseInt(e.target.value))}
                className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {MONTH_NAMES.map((m, idx) => (
                  <option key={`start-m-${idx + 1}`} value={idx + 1}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-between items-center text-xs text-slate-500 mt-1">
              <span>Endeks:</span>
              <span className="font-mono text-amber-400">{result.startPeriod.cpiIndex.toFixed(2)}</span>
            </div>
          </div>

          {/* Hedef / Bugünkü Dönem */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Hedef / Bugünkü Tarih
            </label>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={targetYear}
                onChange={(e) => setTargetYear(parseInt(e.target.value))}
                className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {availableYears
                  .filter((yr) => yr >= startYear)
                  .map((yr) => (
                    <option key={`target-yr-${yr}`} value={yr}>
                      {yr}
                    </option>
                  ))}
              </select>
              <select
                value={targetMonth}
                onChange={(e) => setTargetMonth(parseInt(e.target.value))}
                className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {MONTH_NAMES.map((m, idx) => (
                  <option key={`target-m-${idx + 1}`} value={idx + 1}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-between items-center text-xs text-slate-500 mt-1">
              <span>Endeks:</span>
              <span className="font-mono text-emerald-400">{result.targetPeriod.cpiIndex.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Özel Endeks Girişi Toggle */}
        <div className="mt-4 pt-4 border-t border-slate-800/80">
          <button
            type="button"
            onClick={() => setUseCustomIndices(!useCustomIndices)}
            className="flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition"
          >
            <FaSlidersH />
            {useCustomIndices ? 'Resmi TÜİK Tablosuna Dön' : 'Özel Endeks Değerleri Gir (Sözleşme / Hakediş Endeksleri)'}
          </button>

          {useCustomIndices && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 p-4 bg-slate-950/60 rounded-xl border border-slate-800">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Özel Başlangıç Endeksi
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="örn: 269.54"
                  value={customStartIndex ?? ''}
                  onChange={(e) => setCustomStartIndex(parseFloat(e.target.value) || undefined)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Özel Hedef Endeks
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="örn: 2684.55"
                  value={customTargetIndex ?? ''}
                  onChange={(e) => setCustomTargetIndex(parseFloat(e.target.value) || undefined)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sonuç Gösterge Paneli */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ana Eşdeğer Değer Kartı */}
        <div className="lg:col-span-1 bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/30 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-amber-400 text-sm font-semibold mb-2">
              <span>HEDEF TARİHTEKİ EŞDEĞER DEĞER</span>
              <FaCoins />
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              ₺{result.adjustedAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-slate-400 mt-2">
              {result.startPeriod.label} tarihindeki {initialAmount.toLocaleString('tr-TR')} ₺ tutarının {result.targetPeriod.label} dönemindeki reel satın alma gücü karşılığıdır.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/80 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Fiyat Artış Çarpanı:</span>
              <span className="font-bold text-amber-300">{result.multiplier.toFixed(2)} Kat</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Bugünkü 1 TL Reel Değeri:</span>
              <span className="font-bold text-slate-300 font-mono">₺{result.realValueOfOneLira.toFixed(4)}</span>
            </div>
          </div>
        </div>

        {/* 4'lü Metrik Kartları */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
          {/* Kümülatif TÜFE Artışı */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-rose-400 text-xs font-semibold">
              <span>KÜMÜLATİF ENFLASYON</span>
              <FaPercent />
            </div>
            <div className="text-2xl font-bold text-rose-300 mt-2">
              +%{result.cumulativeInflationRatePercent.toLocaleString('tr-TR')}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">İki dönem arası toplam TÜFE sepet artışı</p>
          </div>

          {/* Paranın Alım Gücü Kaybı */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-amber-400 text-xs font-semibold">
              <span>ALIM GÜCÜ ERİMESİ</span>
              <FaHistory />
            </div>
            <div className="text-2xl font-bold text-amber-300 mt-2">
              -%{result.purchasingPowerLossPercent.toLocaleString('tr-TR')}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Paranın enflasyon karşısında değer kaybı</p>
          </div>

          {/* Yıllık Bileşik Enflasyon (CAGR) */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-indigo-400 text-xs font-semibold">
              <span>YILLIK BİLEŞİK ARTIŞ</span>
              <FaChartLine />
            </div>
            <div className="text-2xl font-bold text-indigo-300 mt-2">
              %{result.annualCompoundRatePercent.toLocaleString('tr-TR')}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">CAGR eşdeğeri yıllık ortalama TÜFE oranı</p>
          </div>

          {/* TÜFE Endeks Farkı */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-emerald-400 text-xs font-semibold">
              <span>ENDEKS DEĞİŞİMİ</span>
              <FaCalendarAlt />
            </div>
            <div className="text-lg font-bold text-emerald-300 mt-2 font-mono">
              {result.startPeriod.cpiIndex.toFixed(1)} → {result.targetPeriod.cpiIndex.toFixed(1)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">TÜİK 2003=100 Temel Yıllı TÜFE Endeksleri</p>
          </div>
        </div>
      </div>

      {/* Rapor & Dava Metni Özeti */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-md font-bold text-white flex items-center gap-2">
            <FaFileContract className="text-amber-400" />
            Hukuki & Mali Uyarlama Özeti
          </h3>
          <button
            type="button"
            onClick={copySummary}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
          >
            {copied ? (
              <>
                <FaCheck className="text-emerald-400" /> Kopyalandı
              </>
            ) : (
              <>
                <FaCopy /> Metni Kopyala
              </>
            )}
          </button>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
          {result.summary}
        </p>
      </div>

      {/* Yıllık İlerleme Tablosu */}
      {result.yearlyProgression.length > 1 && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h3 className="text-md font-bold text-white flex items-center gap-2 mb-4">
            <FaChartLine className="text-emerald-400" />
            Dönem Boyunca Yıllık Değişim Tablosu
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                  <th className="py-3 px-4">Yıl</th>
                  <th className="py-3 px-4">TÜİK TÜFE Endeksi</th>
                  <th className="py-3 px-4">Kümülatif Enflasyon</th>
                  <th className="py-3 px-4 text-right">Eşdeğer Satın Alma Değeri</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {result.yearlyProgression.map((item) => (
                  <tr key={`prog-${item.year}`} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-semibold text-white">{item.year}</td>
                    <td className="py-3 px-4 font-mono text-slate-300">{item.cpiIndex.toFixed(2)}</td>
                    <td className="py-3 px-4 text-rose-400 font-medium">
                      +{item.cumulativeInflationPercent.toLocaleString('tr-TR')}%
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-emerald-400">
                      ₺{item.equivalentAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* API Entegrasyon Bilgi Notu */}
      <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-4 text-xs text-slate-400 flex items-start gap-3">
        <FaInfoCircle className="text-amber-400 text-base mt-0.5 shrink-0" />
        <div>
          <span className="text-slate-200 font-semibold">Geliştiriciler & Yazılım Entegratörleri için REST API:</span>{' '}
          Bu hesaplamayı ERP, CRM veya hukuki muhasebe yazılımlarınıza doğrudan entegre etmek için{' '}
          <code className="text-amber-300 bg-slate-800 px-1.5 py-0.5 rounded font-mono">
            POST /api/v1/finance/inflation-purchasing-power
          </code>{' '}
          uç noktasını kullanabilirsiniz.
        </div>
      </div>
    </div>
  );
}
