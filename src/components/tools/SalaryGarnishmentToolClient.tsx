'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  FaArrowLeft,
  FaCalculator,
  FaGavel,
  FaMoneyBillWave,
  FaPlus,
  FaTrash,
  FaInfoCircle,
  FaCopy,
  FaCheck,
  FaExclamationTriangle,
  FaListOl,
} from 'react-icons/fa';
import TrackRecentTool from '@/components/tools/TrackRecentTool';
import {
  calculateSalaryGarnishment,
  type GarnishmentFile,
  type SalaryGarnishmentInput,
} from '@/modules/tr-api/salaryGarnishment';

export default function SalaryGarnishmentToolClient() {
  const [monthlyNetSalary, setMonthlyNetSalary] = useState<number>(32000);
  const [hasAlimony, setHasAlimony] = useState<boolean>(false);
  const [alimonyAmount, setAlimonyAmount] = useState<number>(4000);
  const [useCustomRate, setUseCustomRate] = useState<boolean>(false);
  const [customRate, setCustomRate] = useState<number>(25);
  const [bonusNet, setBonusNet] = useState<number>(0);

  const [files, setFiles] = useState<GarnishmentFile[]>([
    { fileId: '1. Sıra: İstanbul 8. İcra 2024/1142', remainingDebt: 24000 },
    { fileId: '2. Sıra: Ankara 3. İcra 2024/5521', remainingDebt: 36000 },
  ]);

  const [copied, setCopied] = useState<boolean>(false);

  const handleAddFile = () => {
    setFiles([
      ...files,
      { fileId: `${files.length + 1}. Sıra: İcra Dosyası`, remainingDebt: 15000 },
    ]);
  };

  const handleRemoveFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleUpdateFile = (index: number, field: keyof GarnishmentFile, val: any) => {
    const updated = [...files];
    updated[index] = { ...updated[index], [field]: val };
    setFiles(updated);
  };

  const calculationInput: SalaryGarnishmentInput = useMemo(() => {
    return {
      monthlyNetSalary: Number(monthlyNetSalary) || 0,
      monthlyAlimonyAmount: hasAlimony ? Number(alimonyAmount) || 0 : 0,
      customGarnishmentPercent: useCustomRate ? Number(customRate) || 25 : undefined,
      additionalBonusNet: Number(bonusNet) || 0,
      files,
    };
  }, [monthlyNetSalary, hasAlimony, alimonyAmount, useCustomRate, customRate, bonusNet, files]);

  const result = useMemo(() => {
    return calculateSalaryGarnishment(calculationInput);
  }, [calculationInput]);

  const curlCommand = useMemo(() => {
    const payload = JSON.stringify(calculationInput, null, 2);
    return `curl -X POST https://noktanyus.com/api/v1/labor/salary-garnishment \\
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
      <TrackRecentTool slug="maas-haczi-hesaplama" title="Maaş Haczi ve Sıra Cetveli" />

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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
            <FaGavel className="w-3 h-3" />
            <span>2004 Sayılı İİK Madde 83 & Yargıtay İçtihatları</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white">
            Maaş Haczi, Nafaka Önceliği & İcra Sıra Cetveli Hesaplama
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base max-w-3xl">
            İK uzmanları, bordro sorumluları ve çalışanlar için net maaştan yasal <strong>1/4 (%25) haciz kesintisi</strong>,
            öncelikli <strong>cari nafaka</strong> düşümü ve birden fazla icra dosyası için <strong>sıra cetveli (aylık ödeme ve bitiş projeksiyonu)</strong> simülasyonu.
          </p>
        </header>

        {/* Main Grid: Form and Results */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Inputs Section */}
          <div className="lg:col-span-6 p-6 sm:p-8 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xl backdrop-blur-sm space-y-6">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
              <FaCalculator className="w-4 h-4 text-brand-primary" />
              Maaş & Kesinti Bilgileri
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Aylık Net Maaş (TL) (Vergi & SGK Kesintisi Sonrası Ele Geçen)
                </label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={monthlyNetSalary}
                  onChange={(e) => setMonthlyNetSalary(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm"
                />
              </div>

              {/* Nafaka Checkbox */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-800 dark:text-slate-200 font-semibold">
                  <input
                    type="checkbox"
                    checked={hasAlimony}
                    onChange={(e) => setHasAlimony(e.target.checked)}
                    className="w-4 h-4 text-brand-primary rounded focus:ring-brand-primary border-slate-300"
                  />
                  <span>Aylık Cari Nafaka Kesintisi Var Mı?</span>
                </label>

                {hasAlimony && (
                  <div className="pt-2">
                    <label className="block text-[11px] text-slate-500 mb-1">
                      Aylık Düzenli Nafaka Tutarı (TL) (Öncelikli olarak 1/4 sınırına tabi olmadan kesilir)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="250"
                      value={alimonyAmount}
                      onChange={(e) => setAlimonyAmount(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                    />
                  </div>
                )}
              </div>

              {/* İkramiye / Ek Kazanç */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Mevcut Ayda Net Prim / İkramiye (Opsiyonel, TL)
                </label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={bonusNet}
                  onChange={(e) => setBonusNet(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm"
                />
              </div>

              {/* Özel Muvafakat Oranı */}
              <div>
                <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={useCustomRate}
                    onChange={(e) => setUseCustomRate(e.target.checked)}
                    className="w-4 h-4 text-brand-primary rounded focus:ring-brand-primary border-slate-300"
                  />
                  <span>Borçlunun Kendi Talebiyle Daha Yüksek Kesinti Muvafakati Var</span>
                </label>

                {useCustomRate && (
                  <div className="mt-2">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={customRate}
                      onChange={(e) => setCustomRate(Number(e.target.value))}
                      placeholder="Muvafakat Oranı % (Örn: 50)"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm"
                    />
                  </div>
                )}
              </div>

              {/* Multiple Enforcement Files */}
              <div className="pt-2 space-y-3">
                <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                    <FaListOl className="w-3.5 h-3.5 text-brand-primary" />
                    İcra Takip Dosyaları (Sıra Cetveli)
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddFile}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20 transition-colors"
                  >
                    <FaPlus className="w-3 h-3" />
                    <span>Dosya Ekle</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {files.map((file, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-center gap-2"
                    >
                      <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center text-xs font-bold shrink-0">
                        {idx + 1}
                      </div>
                      <input
                        type="text"
                        value={file.fileId}
                        onChange={(e) => handleUpdateFile(idx, 'fileId', e.target.value)}
                        placeholder="İcra Dairesi / Dosya No"
                        className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                      />
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={file.remainingDebt}
                        onChange={(e) => handleUpdateFile(idx, 'remainingDebt', Number(e.target.value))}
                        placeholder="Borç (TL)"
                        className="w-28 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-right"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(idx)}
                        className="p-2 text-rose-500 hover:text-rose-700 rounded-lg transition-colors"
                        aria-label="Dosyayı Sil"
                      >
                        <FaTrash className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Results Summary & KPI Cards */}
          <div className="lg:col-span-6 space-y-6">
            {/* Net Remaining Take-Home Card */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-200">
                  Çalışanın Eline Kalan Net Para
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/20 text-white">
                  Geçim Tutarı
                </span>
              </div>
              <div className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                {result.employeeRemainingNetTakeHome.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
              </div>
              <p className="text-xs text-emerald-100 leading-relaxed">
                Aylık toplam net maaştan nafaka ve 1/4 yasal icra kesintileri düşüldükten sonra çalışanın banka hesabına yatacak tutardır.
              </p>
            </div>

            {/* Deduction Breakdown Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 shadow-sm">
                <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider block">
                  Aylık İcra Kesintisi (1/4)
                </span>
                <span className="text-xl sm:text-2xl font-extrabold text-rose-600 dark:text-rose-400 mt-1 block">
                  -{result.salaryGarnishmentAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">
                  Oran: %{result.appliedSalaryGarnishmentRatePercent}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Cari Nafaka Kesintisi
                </span>
                <span className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-1 block">
                  {result.alimonyDeduction > 0
                    ? `-${result.alimonyDeduction.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL`
                    : '0 TL'}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">
                  {result.alimonyDeduction > 0 ? 'Öncelikli Kesinti' : 'Nafaka Yok'}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Haczedilebilir Maaş Matrahı
                </span>
                <span className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-1 block">
                  {result.attachableBaseSalary.toLocaleString('tr-TR')} TL
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">
                  Nafaka Düşülmüş Kalan
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 shadow-sm">
                <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider block">
                  Toplam Aylık Kesinti
                </span>
                <span className="text-xl sm:text-2xl font-extrabold text-rose-600 dark:text-rose-400 mt-1 block">
                  -{result.totalMonthlyDeduction.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">
                  İcra + Nafaka Toplamı
                </span>
              </div>
            </div>

            {/* Queue Projection Table */}
            {result.queueProjection && result.queueProjection.filesSummary.length > 0 && (
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                    <FaListOl className="w-3.5 h-3.5 text-brand-primary" />
                    İcra Sıra Cetveli & Bitiş Tahmini
                  </h4>
                  <span className="text-xs font-semibold text-brand-primary">
                    Toplam: ~{result.queueProjection.estimatedMonthsToClearAll} Ayda Biter
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  {result.queueProjection.filesSummary.map((f, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 flex items-center justify-between border border-slate-200 dark:border-slate-800"
                    >
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <span>{f.orderNumber}. Sıra: {f.fileId}</span>
                          {f.status === 'active' && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-600 font-bold">
                              Şu An Kesilen
                            </span>
                          )}
                          {f.status === 'waiting' && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-500">
                              Sırada Bekliyor
                            </span>
                          )}
                        </div>
                        <span className="text-slate-400 text-[11px] mt-0.5 block">
                          Kalan Borç: {f.debt.toLocaleString('tr-TR')} TL
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-extrabold text-slate-800 dark:text-slate-200">
                          ~{f.estimatedMonths} Ay
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Legal Liability Warning Box */}
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 space-y-1.5">
              <div className="font-bold flex items-center gap-1.5">
                <FaExclamationTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                İşverenin Yasal & Cezai Sorumluluğu (İİK m.356)
              </div>
              <p className="leading-relaxed opacity-90">
                {result.legalNotice.employerLiabilityWarning}
              </p>
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
                İK veya bordro ERP yazılımınızda otomatik icra kesintisi ve sıra cetveli için:
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
