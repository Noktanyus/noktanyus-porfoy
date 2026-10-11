'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  FaMoneyCheckAlt,
  FaCalendarAlt,
  FaPlus,
  FaTrash,
  FaCalculator,
  FaFileInvoiceDollar,
  FaBook,
  FaCopy,
  FaCheck,
  FaInfoCircle,
  FaPercent,
  FaBalanceScale,
} from 'react-icons/fa';
import {
  calculateCheckDiscount,
  TCMB_REESKONT_RATES,
  type CheckItemInput,
} from '@/modules/tr-api/checkDiscount';

export default function CheckDiscountToolClient() {
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const [valuationDate, setValuationDate] = useState<string>(todayStr);
  const [rateOption, setRateOption] = useState<'discount' | 'advance' | 'custom'>('discount');
  const [selectedPresetCode, setSelectedPresetCode] = useState<string>('2024_CURRENT');
  const [customRate, setCustomRate] = useState<number>(48.75);
  const [method, setMethod] = useState<'internal' | 'external'>('internal');

  // Initial demo portfolio
  const [items, setItems] = useState<CheckItemInput[]>([
    {
      id: '1',
      description: 'A Firması Müşteri Çeki',
      nominalAmount: 150000,
      dueDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      itemType: 'receivable',
    },
    {
      id: '2',
      description: 'B Ltd. Vadeli Çek',
      nominalAmount: 280000,
      dueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      itemType: 'receivable',
    },
    {
      id: '3',
      description: 'Hammadde Tedarikçi Senedi',
      nominalAmount: 120000,
      dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      itemType: 'payable',
    },
  ]);

  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const result = useMemo(() => {
    return calculateCheckDiscount({
      valuationDate,
      rateOption,
      selectedPresetCode,
      customAnnualRate: customRate,
      method,
      items,
    });
  }, [valuationDate, rateOption, selectedPresetCode, customRate, method, items]);

  const addItem = () => {
    const nextDays = (items.length + 1) * 30;
    const nextDate = new Date(Date.now() + nextDays * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    setItems([
      ...items,
      {
        id: String(Date.now()),
        description: `Çek / Senet #${items.length + 1}`,
        nominalAmount: 50000,
        dueDate: nextDate,
        itemType: 'receivable',
      },
    ]);
  };

  const removeItem = (id: string | undefined) => {
    if (items.length <= 1) return;
    setItems(items.filter((item) => item.id !== id));
  };

  const updateItem = (id: string | undefined, field: keyof CheckItemInput, value: any) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const curlExample = `curl -X POST https://noktanyus.com/api/v1/finance/check-discount \\
  -H "Content-Type: application/json" \\
  -d '{
    "valuationDate": "${valuationDate}",
    "rateOption": "${rateOption}",
    "method": "${method}",
    "items": ${JSON.stringify(items, null, 2)}
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
          <span className="text-slate-200">Çek & Senet Reeskont Faiz Hesaplama</span>
        </div>

        {/* Hero Title */}
        <div className="border-b border-slate-800 pb-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="p-2.5 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl text-white shadow-lg shadow-indigo-500/20">
              <FaMoneyCheckAlt className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Çek & Senet Reeskont Faiz Hesaplama ve Ortalama Vade Motoru
              </h1>
              <p className="text-slate-400 mt-1 text-sm sm:text-base">
                213 sayılı VUK m.281/285 uyarınca iç iskonto / dış iskonto formülü, TCMB resmi reeskont faiz oranları, portföy ağırlıklı ortalama vadesi ve Tekdüzen Hesap Planı yevmiye kaydı dökümü.
              </p>
            </div>
          </div>
        </div>

        {/* Global Controls Bar */}
        <div className="bg-slate-800/80 backdrop-blur border border-slate-700/80 rounded-2xl p-6 shadow-xl space-y-4">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2 border-b border-slate-700/60 pb-3">
            <FaCalculator className="text-indigo-400" /> Değerleme ve Faiz Parametreleri
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Valuation Date */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                <FaCalendarAlt className="text-indigo-400" /> Değerleme (Bilanço) Tarihi
              </label>
              <input
                type="date"
                value={valuationDate}
                onChange={(e) => setValuationDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Preset & Rate Selection */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                <FaPercent className="text-emerald-400" /> Faiz Türü & Oranı
              </label>
              <select
                value={rateOption}
                onChange={(e) => setRateOption(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="discount">TCMB Reeskont Faizi (%{TCMB_REESKONT_RATES[0].discountRate})</option>
                <option value="advance">TCMB Avans Faizi (%{TCMB_REESKONT_RATES[0].advanceRate})</option>
                <option value="custom">Özel Faiz Oranı Belirle</option>
              </select>
            </div>

            {/* Custom Rate Input */}
            {rateOption === 'custom' ? (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Yıllık Özel Faiz Oranı (%)</label>
                <input
                  type="number"
                  step="0.25"
                  min="0"
                  value={customRate}
                  onChange={(e) => setCustomRate(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Uygulanan Resmi Oran</label>
                <div className="bg-slate-900/60 border border-slate-700 rounded-xl px-3 py-2 text-indigo-400 font-mono text-sm font-bold">
                  %{result.appliedAnnualRate} / Yıllık
                </div>
              </div>
            )}

            {/* Method (Internal vs External) */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                <FaBalanceScale className="text-amber-400" /> İskonto Yöntemi
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="internal">İç İskonto (VUK 238 Zorunlu)</option>
                <option value="external">Dış İskonto (Ticari Yöntem)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Summary Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-lg space-y-2">
            <span className="text-xs text-slate-400 font-medium">Toplam Nominal Tutar</span>
            <div className="text-2xl font-bold text-white font-mono">
              {result.totalNominalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
            </div>
            <div className="text-[11px] text-slate-400">{result.itemCount} adet çek / senet</div>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-lg space-y-2">
            <span className="text-xs text-rose-400 font-medium flex items-center gap-1">
              <FaPercent className="text-xs" /> Toplam Reeskont Tutarı
            </span>
            <div className="text-2xl font-bold text-rose-400 font-mono">
              {result.totalDiscountAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
            </div>
            <div className="text-[11px] text-slate-400">Dönem net reeskont etkisi</div>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-lg space-y-2">
            <span className="text-xs text-emerald-400 font-medium">Net Bilanço Değeri (NPV)</span>
            <div className="text-2xl font-bold text-emerald-400 font-mono">
              {result.totalNetPresentValue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
            </div>
            <div className="text-[11px] text-slate-400">Değerleme günündeki peşin değer</div>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-lg space-y-2">
            <span className="text-xs text-indigo-400 font-medium">Ağırlıklı Ortalama Vade</span>
            <div className="text-2xl font-bold text-indigo-400 font-mono">
              {result.weightedAverageDays} Gün
            </div>
            <div className="text-[11px] text-slate-400">Ortalama Tarih: {result.weightedAverageDueDate}</div>
          </div>
        </div>

        {/* Interactive Checks Table */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700/60 pb-3">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <FaFileInvoiceDollar className="text-indigo-400" /> Çek ve Senet Portföy Listesi
            </h2>
            <button
              type="button"
              onClick={addItem}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors shadow-lg shadow-indigo-600/20"
            >
              <FaPlus className="w-3 h-3" /> Yeni Çek / Senet Ekle
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-700">
                <tr>
                  <th className="p-3">Açıklama / Keşideci</th>
                  <th className="p-3">Tür</th>
                  <th className="p-3">Nominal Tutar (₺)</th>
                  <th className="p-3">Vade Tarihi</th>
                  <th className="p-3">Kalan Gün</th>
                  <th className="p-3">Reeskont Faizi (₺)</th>
                  <th className="p-3">Bugünkü Değer (₺)</th>
                  <th className="p-3 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {result.items.map((item, index) => (
                  <tr key={item.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="p-3">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                        className="w-full bg-slate-900/60 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                      />
                    </td>
                    <td className="p-3">
                      <select
                        value={item.itemType}
                        onChange={(e) => updateItem(item.id, 'itemType', e.target.value)}
                        className="bg-slate-900/60 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-200 cursor-pointer"
                      >
                        <option value="receivable">Alacak Senedi (121)</option>
                        <option value="payable">Borç Senedi (321)</option>
                      </select>
                    </td>
                    <td className="p-3">
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={item.nominalAmount}
                        onChange={(e) => updateItem(item.id, 'nominalAmount', parseFloat(e.target.value) || 0)}
                        className="w-32 bg-slate-900/60 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
                      />
                    </td>
                    <td className="p-3">
                      <input
                        type="date"
                        value={item.dueDate}
                        onChange={(e) => updateItem(item.id, 'dueDate', e.target.value)}
                        className="bg-slate-900/60 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
                      />
                    </td>
                    <td className="p-3 font-mono font-medium text-slate-300">
                      {item.daysToMaturity} gün
                    </td>
                    <td className="p-3 font-mono font-bold text-rose-400">
                      {item.discountAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                    </td>
                    <td className="p-3 font-mono font-bold text-emerald-400">
                      {item.netPresentValue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                    </td>
                    <td className="p-3 text-right">
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        disabled={items.length <= 1}
                        className="text-slate-500 hover:text-rose-400 disabled:opacity-30 disabled:hover:text-slate-500 p-1.5 transition-colors"
                        title="Sil"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Accounting Entries (Tekdüzen Yevmiye Fişi) */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-xl space-y-4">
          <h2 className="text-base font-semibold text-white flex items-center gap-2 border-b border-slate-700/60 pb-3">
            <FaBook className="text-purple-400" /> Tekdüzen Hesap Planı (THP) Reeskont Muhasebe Kaydı
          </h2>
          <p className="text-xs text-slate-400">
            Dönem sonu geçici vergi veya yıl sonu bilançosunda kaydedilecek resmi yevmiye maddesi dökümü:
          </p>

          <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3">Hesap Kodu</th>
                  <th className="p-3">Hesap Adı</th>
                  <th className="p-3 text-right">Borç (₺)</th>
                  <th className="p-3 text-right">Alacak (₺)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {result.accountingEntries.length > 0 ? (
                  result.accountingEntries.map((entry, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/40">
                      <td className="p-3 font-bold text-indigo-400">{entry.accountCode}</td>
                      <td className="p-3">{entry.accountName}</td>
                      <td className="p-3 text-right font-bold text-emerald-400">
                        {entry.debit > 0 ? entry.debit.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) : '-'}
                      </td>
                      <td className="p-3 text-right font-bold text-purple-400">
                        {entry.credit > 0 ? entry.credit.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) : '-'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-slate-500 font-sans">
                      Hesaplanmış bir reeskont kaydı bulunamadı.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* cURL & REST API Entegrasyon Kodu */}
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

        {/* FAQ & Educational Content */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FaInfoCircle className="text-indigo-400" /> Çek & Senet Reeskontu Hakkında Sıkça Sorulan Sorular
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-slate-300">
            <div className="space-y-2 bg-slate-900/60 p-4 rounded-xl border border-slate-700/50">
              <h3 className="font-semibold text-white">1. Reeskont nedir ve neden hesaplanır?</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                213 sayılı VUK m.281 uyarınca senede bağlı alacak ve borçların, bilanço (değerleme) günündeki peşin değerine indirgenmesidir. Bu sayede vadesi sonraki yıla veya döneme ait olan faiz gelir ve giderleri ilgili döneme yansıtılır.
              </p>
            </div>

            <div className="space-y-2 bg-slate-900/60 p-4 rounded-xl border border-slate-700/50">
              <h3 className="font-semibold text-white">2. Neden İç İskonto formülü zorunludur?</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                VUK 238 Sıra No’lu Genel Tebliği gereğince vergi uygulamalarında reeskont tutarı mutlaka iç iskonto formülü [F = (A * n * t) / (36000 + (n * t))] ile hesaplanmalıdır. Dış iskonto yöntemi yalnızca ticari bankacılık işlemlerinde kullanılır.
              </p>
            </div>

            <div className="space-y-2 bg-slate-900/60 p-4 rounded-xl border border-slate-700/50">
              <h3 className="font-semibold text-white">3. Hangi faiz oranı uygulanmalıdır?</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Senette özel bir faiz oranı kararlaştırılmamışsa, TCMB tarafından Resmi Gazete’de ilan edilen ticari senet reeskont iskonto faiz oranı veya avans faiz oranı uygulanır.
              </p>
            </div>

            <div className="space-y-2 bg-slate-900/60 p-4 rounded-xl border border-slate-700/50">
              <h3 className="font-semibold text-white">4. Çekler için reeskont ayrılabilir mi?</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                6102 sayılı TTK gereği çek görüldüğünde ödenen bir ödeme aracı olmakla birlikte, Türkiye uygulamasında vadeli çeklere ilişkin geçici yasa maddeleri ve VUK 316 Sıra No’lu Genel Tebliği uyarınca ileri vadeli çekler için de reeskont uygulanabilmektedir.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
