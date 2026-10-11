'use client';

import React, { useState, useMemo } from 'react';
import {
  calculateSeverancePay,
  OFFICIAL_SEVERANCE_CAPS,
} from '@/modules/tr-api/severancePay';
import {
  FaUserTie,
  FaFileInvoiceDollar,
  FaCopy,
  FaCheck,
  FaCalendarAlt,
  FaClock,
  FaExclamationTriangle,
  FaInfoCircle,
  FaSlidersH,
  FaBalanceScale,
  FaUmbrellaBeach,
} from 'react-icons/fa';

export default function SeverancePayToolClient() {
  const [startDate, setStartDate] = useState<string>('2021-06-01');
  const [endDate, setEndDate] = useState<string>('2024-09-01');
  const [grossSalary, setGrossSalary] = useState<number>(35000);
  const [regularBenefitsMonthly, setRegularBenefitsMonthly] = useState<number>(5000);

  const [useCustomCap, setUseCustomCap] = useState<boolean>(false);
  const [customSeveranceCap, setCustomSeveranceCap] = useState<number | undefined>(undefined);

  const [calculateNoticePay, setCalculateNoticePay] = useState<boolean>(true);
  const [noticeIncomeTaxRate, setNoticeIncomeTaxRate] = useState<number>(15);
  const [unusedLeaveDays, setUnusedLeaveDays] = useState<number>(14);

  const [copied, setCopied] = useState<boolean>(false);

  const result = useMemo(() => {
    return calculateSeverancePay({
      startDate,
      endDate,
      grossSalary,
      regularBenefitsMonthly,
      customSeveranceCap: useCustomCap ? customSeveranceCap : undefined,
      calculateNoticePay,
      noticeIncomeTaxRate,
      unusedLeaveDays,
    });
  }, [
    startDate,
    endDate,
    grossSalary,
    regularBenefitsMonthly,
    useCustomCap,
    customSeveranceCap,
    calculateNoticePay,
    noticeIncomeTaxRate,
    unusedLeaveDays,
  ]);

  const copySummary = () => {
    navigator.clipboard.writeText(result.legalSummary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Parametre Giriş Paneli */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-800 mb-6 gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <FaUserTie className="text-emerald-400" />
              4857 Sayılı İş Kanunu Kıdem & İhbar Tazminatı Hesaplayıcı
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Giydirilmiş brüt ücret, Hazine resmi kıdem tavanı, damga vergisi, ihbar önelleri ve yıllık izin hesabı.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
            <FaClock className="text-amber-400" />
            <span>Hizmet Süresi: <strong className="text-white">{result.serviceDuration.formattedText}</strong></span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* İşe Giriş Tarihi */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              İşe Giriş Tarihi
            </label>
            <div className="relative">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* İşten Çıkış Tarihi */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              İşten Çıkış / Fesih Tarihi
            </label>
            <div className="relative">
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Çıplak Brüt Maaş */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Aylık Çıplak Brüt Maaş (TL)
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="500"
                value={grossSalary}
                onChange={(e) => setGrossSalary(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-base font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="absolute right-4 top-2.5 text-slate-400 font-bold">₺</span>
            </div>
          </div>

          {/* Düzenli Yan Haklar (Aylık Brüt) */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Düzenli Yan Haklar (Yol/Yemek/Prim)
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="500"
                value={regularBenefitsMonthly}
                onChange={(e) => setRegularBenefitsMonthly(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-base font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="absolute right-4 top-2.5 text-slate-400 font-bold">₺</span>
            </div>
          </div>
        </div>

        {/* Giydirilmiş Brüt Bilgi Bandı */}
        <div className="mt-4 p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Giydirilmiş Brüt Ücret (Kıdem Esası):</span>
            <strong className="text-emerald-400 font-mono text-sm">
              ₺{result.effectiveGrossMonthly.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
            </strong>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Uygulanan Kıdem Tavanı:</span>
            <span className="text-amber-300 font-mono">
              ₺{result.severance.appliedCap.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
            </span>
            {result.severance.isCapped && (
              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30">
                Tavan Aşıldı
              </span>
            )}
          </div>
        </div>

        {/* Ek Seçenekler (İhbar & İzin & Özel Tavan) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 pt-6 border-t border-slate-800">
          {/* İhbar Tazminatı */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="calcNotice"
                checked={calculateNoticePay}
                onChange={(e) => setCalculateNoticePay(e.target.checked)}
                className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-emerald-500 w-4 h-4"
              />
              <label htmlFor="calcNotice" className="text-sm font-medium text-slate-200 cursor-pointer">
                İhbar Tazminatı Hesaplansın
              </label>
            </div>
            {calculateNoticePay && (
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  İhbar Gelir Vergisi Dilimi
                </label>
                <select
                  value={noticeIncomeTaxRate}
                  onChange={(e) => setNoticeIncomeTaxRate(parseInt(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value={15}>%15 (1. Dilim - Yıl Başı)</option>
                  <option value={20}>%20 (2. Dilim)</option>
                  <option value={27}>%27 (3. Dilim)</option>
                  <option value={35}>%35 (4. Dilim)</option>
                  <option value={40}>%40 (5. Dilim - Üst Gelir)</option>
                </select>
              </div>
            )}
          </div>

          {/* Kullanılmamış Yıllık İzin */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Kullanılmamış Yıllık İzin (Gün)
            </label>
            <input
              type="number"
              min="0"
              max="120"
              value={unusedLeaveDays}
              onChange={(e) => setUnusedLeaveDays(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">İş Kanunu m.59 uyarınca fesihte nakde dönüşür</p>
          </div>

          {/* Özel Kıdem Tavanı Ayarı */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium text-slate-300">
                Özel Kıdem Tavanı
              </label>
              <button
                type="button"
                onClick={() => setUseCustomCap(!useCustomCap)}
                className="text-[11px] text-emerald-400 hover:underline"
              >
                {useCustomCap ? 'Resmiye Dön' : 'Özel Gir'}
              </button>
            </div>
            {useCustomCap ? (
              <input
                type="number"
                step="100"
                placeholder="Örn: 41828.42"
                value={customSeveranceCap ?? ''}
                onChange={(e) => setCustomSeveranceCap(parseFloat(e.target.value) || undefined)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            ) : (
              <div className="text-xs text-slate-400 bg-slate-800/40 p-2.5 rounded-xl border border-slate-800">
                Çıkış tarihine göre resmi Hazine tavanı otomatik seçilir.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sonuç Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ana Net Hakediş Kartı */}
        <div className="lg:col-span-1 bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-emerald-400 text-sm font-semibold mb-2">
              <span>TOPLAM NET ELE GEÇECEK HAKEDİŞ</span>
              <FaFileInvoiceDollar />
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              ₺{result.totalNetPay.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Tüm yasal kesintiler (Damga Vergisi, Gelir Vergisi, SGK) düşüldükten sonra çalışana ödenecek net feshî tazminat toplamıdır.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/80 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Toplam Brüt Hakediş:</span>
              <span className="font-semibold text-white">
                ₺{result.totalGrossPay.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Toplam Yasal Kesintiler:</span>
              <span className="font-semibold text-rose-400">
                -₺{result.totalDeductions.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* 3 Detay Kartı (Kıdem, İhbar, İzin) */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Kıdem Tazminatı */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-emerald-400 text-xs font-semibold">
                <span>KIDEM TAZMİNATI</span>
                <FaBalanceScale />
              </div>
              {result.severance.eligibleForSeverance ? (
                <>
                  <div className="text-xl font-bold text-white mt-2">
                    ₺{result.severance.netSeverance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="space-y-1 mt-2 text-[11px] text-slate-400">
                    <div className="flex justify-between">
                      <span>Brüt Kıdem:</span>
                      <span className="text-slate-200">₺{result.severance.grossSeverance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Damga Vergisi (‰7.59):</span>
                      <span className="text-rose-400">-₺{result.severance.stampTax.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="mt-3 text-xs text-amber-400 flex items-center gap-1.5">
                  <FaExclamationTriangle />
                  <span>1 yıldan az hizmet süresi nedeniyle kıdem hakkı yoktur.</span>
                </div>
              )}
            </div>
            <div className="mt-3 pt-2 border-t border-slate-800/80 text-[10px] text-slate-500">
              1475 s.K. m.14 (SGK & GV kesintisi yoktur)
            </div>
          </div>

          {/* İhbar Tazminatı */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-blue-400 text-xs font-semibold">
                <span>İHBAR TAZMİNATI</span>
                <FaClock />
              </div>
              {result.notice ? (
                <>
                  <div className="text-xl font-bold text-white mt-2">
                    ₺{result.notice.netNotice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="space-y-1 mt-2 text-[11px] text-slate-400">
                    <div className="flex justify-between">
                      <span>Önel Süresi:</span>
                      <span className="text-slate-200">{result.notice.noticeWeeks} Hafta ({result.notice.noticeDays} Gün)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Brüt İhbar:</span>
                      <span className="text-slate-200">₺{result.notice.grossNotice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Gelir + Damga V.:</span>
                      <span className="text-rose-400">-₺{(result.notice.incomeTax + result.notice.stampTax).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="mt-3 text-xs text-slate-500">Hesaplamaya dahil edilmedi.</div>
              )}
            </div>
            <div className="mt-3 pt-2 border-t border-slate-800/80 text-[10px] text-slate-500">
              4857 s.K. m.17 (GV & DV kesintilidir)
            </div>
          </div>

          {/* Yıllık İzin Ücreti */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-amber-400 text-xs font-semibold">
                <span>YILLIK İZİN ÜCRETİ</span>
                <FaUmbrellaBeach />
              </div>
              {result.unusedLeave ? (
                <>
                  <div className="text-xl font-bold text-white mt-2">
                    ₺{result.unusedLeave.netAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="space-y-1 mt-2 text-[11px] text-slate-400">
                    <div className="flex justify-between">
                      <span>İzin Süresi:</span>
                      <span className="text-slate-200">{result.unusedLeave.leaveDays} Gün</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Brüt İzin:</span>
                      <span className="text-slate-200">₺{result.unusedLeave.grossAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>SGK, GV & DV Kes.:</span>
                      <span className="text-rose-400">
                        -₺{(result.unusedLeave.sgkWorkerTax + result.unusedLeave.unemploymentTax + result.unusedLeave.incomeTax + result.unusedLeave.stampTax).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="mt-3 text-xs text-slate-500">İzin günü girilmedi.</div>
              )}
            </div>
            <div className="mt-3 pt-2 border-t border-slate-800/80 text-[10px] text-slate-500">
              4857 s.K. m.59 (Çıplak ücretten tam bordrolu)
            </div>
          </div>
        </div>
      </div>

      {/* Arabuluculuk & Bordro Metni Özeti */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-md font-bold text-white flex items-center gap-2">
            <FaBalanceScale className="text-emerald-400" />
            Hukuki ve Feshî Hakediş Özeti (Arabuluculuk & İhtarname Metni)
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
          {result.legalSummary}
        </p>
      </div>

      {/* REST API Entegrasyon Bilgi Notu */}
      <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-4 text-xs text-slate-400 flex items-start gap-3">
        <FaInfoCircle className="text-emerald-400 text-base mt-0.5 shrink-0" />
        <div>
          <span className="text-slate-200 font-semibold">Geliştiriciler & İK Yazılımları için REST API:</span>{' '}
          Bordro, İK veya hukuk yönetim sistemlerinizde kıdem ve ihbar hesaplamalarını otomatikleştirmek için{' '}
          <code className="text-emerald-300 bg-slate-800 px-1.5 py-0.5 rounded font-mono">
            POST /api/v1/labor/severance-pay
          </code>{' '}
          uç noktasını kullanabilirsiniz.
        </div>
      </div>
    </div>
  );
}
