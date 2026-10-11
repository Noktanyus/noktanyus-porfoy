'use client';

import React, { useState, useMemo } from 'react';
import {
  calculateTaxLateInterest,
  OFFICIAL_LATE_FEE_RATES,
  OFFICIAL_ANNUAL_POSTPONEMENT_RATE,
} from '@/modules/tr-api/taxLateInterest';
import {
  FaUniversity,
  FaFileInvoiceDollar,
  FaCalendarAlt,
  FaCopy,
  FaCheck,
  FaPercent,
  FaClock,
  FaInfoCircle,
  FaListOl,
  FaBalanceScale,
  FaSlidersH,
} from 'react-icons/fa';

export default function TaxLateInterestToolClient() {
  const [principalAmount, setPrincipalAmount] = useState<number>(50000);
  const [dueDate, setDueDate] = useState<string>('2024-03-31');
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );

  const [useCustomRate, setUseCustomRate] = useState<boolean>(false);
  const [customMonthlyRate, setCustomMonthlyRate] = useState<number | undefined>(undefined);

  const [calculateInstallments, setCalculateInstallments] = useState<boolean>(false);
  const [installmentCount, setInstallmentCount] = useState<number>(12);

  const [copied, setCopied] = useState<boolean>(false);

  const result = useMemo(() => {
    return calculateTaxLateInterest({
      principalAmount,
      dueDate,
      paymentDate,
      customMonthlyRatePercent: useCustomRate ? customMonthlyRate : undefined,
      calculateInstallments,
      installmentCount,
    });
  }, [principalAmount, dueDate, paymentDate, useCustomRate, customMonthlyRate, calculateInstallments, installmentCount]);

  const copySummary = () => {
    navigator.clipboard.writeText(result.summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const setPresetDates = (due: string) => {
    setDueDate(due);
    setPaymentDate(new Date().toISOString().slice(0, 10));
  };

  return (
    <div className="space-y-8">
      {/* Parametre Giriş Paneli */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-800 mb-6 gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <FaUniversity className="text-rose-400" />
              6183 Sayılı Kanun Vergi Gecikme Zammı & Tecil Faizi
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Vergi daireleri, SGK ve kamu borçları için aylık/günlük resmi gecikme zammı ve taksitlendirme simülatörü.
            </p>
          </div>

          {/* Hızlı Vade Presetleri */}
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setPresetDates('2024-03-31')}
              className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            >
              2024 Gelir V. 1. Taksit
            </button>
            <button
              type="button"
              onClick={() => setPresetDates('2024-04-30')}
              className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            >
              2024 Kurumlar V.
            </button>
            <button
              type="button"
              onClick={() => setPresetDates('2024-07-31')}
              className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            >
              2024 Gelir V. 2. Taksit / MTV
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Asıl Borç Tutarı */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Asıl Vergi / Kamu Borcu (TL)
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="1000"
                value={principalAmount}
                onChange={(e) => setPrincipalAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-base font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
              <span className="absolute right-4 top-2.5 text-slate-400 font-bold">₺</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Vergi, KDV, Stopaj, Harç veya SGK asıl tutarı</p>
          </div>

          {/* Vade Tarihi */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Vade (Son Ödeme) Tarihi
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">Beyanname veya tahakkuk fişindeki son gün</p>
          </div>

          {/* Ödeme / Hesap Tarihi */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Ödeme / Hesaplama Tarihi
            </label>
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">Borcun kapatıldığı veya sorgulandığı gün</p>
          </div>
        </div>

        {/* Özel Oran ve Tecil Taksit Seçenekleri */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-slate-800">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <FaSlidersH /> Özel Aylık Faiz Oranı
              </span>
              <button
                type="button"
                onClick={() => setUseCustomRate(!useCustomRate)}
                className="text-[11px] text-rose-400 hover:underline"
              >
                {useCustomRate ? 'Resmi Orana Dön (%4.50)' : 'Özel Oran Gir'}
              </button>
            </div>
            {useCustomRate ? (
              <input
                type="number"
                step="0.1"
                placeholder="Örn: 4.5"
                value={customMonthlyRate ?? ''}
                onChange={(e) => setCustomMonthlyRate(parseFloat(e.target.value) || undefined)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            ) : (
              <div className="text-xs text-slate-400 bg-slate-800/40 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
                <span>Yürürlükteki Resmi Oran:</span>
                <span className="text-rose-400 font-bold font-mono">Aylık %4.50 (Yıllık %54.00)</span>
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={calculateInstallments}
                  onChange={(e) => setCalculateInstallments(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-rose-500 focus:ring-rose-500 w-4 h-4"
                />
                <span className="text-xs font-medium text-slate-200">
                  6183 m.48 Tecil & Taksitlendirme Planı
                </span>
              </label>
            </div>
            {calculateInstallments && (
              <div className="flex items-center gap-2">
                <select
                  value={installmentCount}
                  onChange={(e) => setInstallmentCount(parseInt(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <option value={6}>6 Ay Taksit (Yıllık %48 Tecil Faizi)</option>
                  <option value={12}>12 Ay Taksit (1 Yıl)</option>
                  <option value={18}>18 Ay Taksit (1.5 Yıl)</option>
                  <option value={24}>24 Ay Taksit (2 Yıl)</option>
                  <option value={36}>36 Ay Taksit (Yasal Azami Süre)</option>
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sonuç Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ana Toplam Tutar Kartı */}
        <div className="lg:col-span-1 bg-gradient-to-br from-rose-950/40 via-slate-900 to-slate-900 border border-rose-500/30 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-rose-400 text-sm font-semibold mb-2">
              <span>TOPLAM ÖDENECEK BORÇ</span>
              <FaFileInvoiceDollar />
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              ₺{result.totalAmountDue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-slate-400 mt-2">
              {result.dueDate} vadeli {principalAmount.toLocaleString('tr-TR')} ₺ borcun gecikme zammı eklenmiş toplam tutarıdır.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/80 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Asıl Kamu Alacağı:</span>
              <span className="font-semibold text-white">
                ₺{result.principalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Tahakkuk Eden Gecikme Zammı:</span>
              <span className="font-bold text-rose-400">
                +₺{result.lateFeeAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* 4'lü Metrik Kartları */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
          {/* Gecikme Zammı Tutarı */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-rose-400 text-xs font-semibold">
              <span>GECİKME ZAMMI</span>
              <FaPercent />
            </div>
            <div className="text-2xl font-bold text-rose-300 mt-2">
              ₺{result.lateFeeAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">6183 s.K. m.51 fer'i alacak</p>
          </div>

          {/* Gecikme Süresi */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-amber-400 text-xs font-semibold">
              <span>GECİKME SÜRESİ</span>
              <FaClock />
            </div>
            <div className="text-xl font-bold text-white mt-2">
              {result.totalDaysOverdue} Gün
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {result.fullMonths} tam ay + {result.fractionDays} gün kesri
            </p>
          </div>

          {/* Aylık Oran */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-emerald-400 text-xs font-semibold">
              <span>AYLIK FAİZ ORANI</span>
              <FaCalendarAlt />
            </div>
            <div className="text-2xl font-bold text-emerald-300 mt-2">
              %{result.appliedMonthlyRatePercent.toLocaleString('tr-TR')}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Günlük oran: %{result.dailyRatePercent.toFixed(2)}</p>
          </div>

          {/* Yasal Dayanak */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-indigo-400 text-xs font-semibold">
              <span>YASAL DAYANAK</span>
              <FaBalanceScale />
            </div>
            <div className="text-xs font-semibold text-slate-200 mt-2 line-clamp-2">
              {result.decreeBasis}
            </div>
            <p className="text-[10px] text-slate-500 mt-1">6183 Sayılı Kanun Madde 51</p>
          </div>
        </div>
      </div>

      {/* Rapor & Açıklama Metni */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-md font-bold text-white flex items-center gap-2">
            <FaBalanceScale className="text-rose-400" />
            Vergi Dairesi & Muhasebe Hesap Özeti
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
        <p className="text-sm text-slate-300 leading-relaxed bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 font-mono">
          {result.summaryText}
        </p>
      </div>

      {/* Tecil ve Taksitlendirme Tablosu (Varsa) */}
      {result.installmentPlan && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 mb-4 gap-2">
            <h3 className="text-md font-bold text-white flex items-center gap-2">
              <FaListOl className="text-emerald-400" />
              6183 m.48 Tecil ve Taksitlendirme Planı ({result.installmentPlan.installmentCount} Ay)
            </h3>
            <span className="text-xs text-slate-400">
              Yıllık Tecil Faizi: <strong>%{result.installmentPlan.annualRatePercent}</strong> (Aylık %{result.installmentPlan.monthlyRatePercent})
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                  <th className="py-2.5 px-3">Taksit No</th>
                  <th className="py-2.5 px-3">Son Ödeme</th>
                  <th className="py-2.5 px-3">Anapara</th>
                  <th className="py-2.5 px-3">Tecil Faizi</th>
                  <th className="py-2.5 px-3 text-right">Taksit Tutarı</th>
                  <th className="py-2.5 px-3 text-right">Kalan Anapara</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {result.installmentPlan.schedule.map((row) => (
                  <tr key={`inst-${row.installmentNumber}`} className="hover:bg-slate-800/40 transition">
                    <td className="py-2.5 px-3 font-semibold text-white">{row.installmentNumber}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-300 text-xs">{row.dueDate}</td>
                    <td className="py-2.5 px-3 text-slate-300">₺{row.principalPortion.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                    <td className="py-2.5 px-3 text-rose-400 font-medium">₺{row.postponementInterest.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-400">₺{row.totalInstallmentAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                    <td className="py-2.5 px-3 text-right text-slate-500 text-xs">₺{row.remainingPrincipal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-slate-700 font-bold text-white text-sm">
                  <td colSpan={2} className="py-3 px-3">TOPLAM</td>
                  <td className="py-3 px-3">₺{result.installmentPlan.totalPrincipal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                  <td className="py-3 px-3 text-rose-400">₺{result.installmentPlan.totalInterest.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                  <td className="py-3 px-3 text-right text-emerald-400">₺{result.installmentPlan.totalRepayment.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* REST API Bilgi Notu */}
      <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-4 text-xs text-slate-400 flex items-start gap-3">
        <FaInfoCircle className="text-rose-400 text-base mt-0.5 shrink-0" />
        <div>
          <span className="text-slate-200 font-semibold">Muhasebe & ERP Yazılımları için REST API:</span>{' '}
          Vergi gecikme zammı ve tecil faizi hesaplamalarını kendi yazılımınıza entegre etmek için{' '}
          <code className="text-rose-300 bg-slate-800 px-1.5 py-0.5 rounded font-mono">
            POST /api/v1/tax/late-interest
          </code>{' '}
          uç noktasını kullanabilirsiniz.
        </div>
      </div>
    </div>
  );
}
