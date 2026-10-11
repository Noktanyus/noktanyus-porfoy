'use client';

import React, { useState, useMemo } from 'react';
import {
  calculateEnforcementCost,
  EnforcementType,
  NoticeType,
  OFFICIAL_ENFORCEMENT_FEES_2024,
} from '@/modules/tr-api/enforcementCost';
import {
  FaGavel,
  FaFileInvoiceDollar,
  FaBalanceScale,
  FaCopy,
  FaCheck,
  FaUserTie,
  FaUsers,
  FaEnvelope,
  FaInfoCircle,
  FaCheckCircle,
  FaTimesCircle,
} from 'react-icons/fa';

export default function EnforcementCostToolClient() {
  const [claimAmount, setClaimAmount] = useState<number>(100000);
  const [enforcementType, setEnforcementType] = useState<EnforcementType>('without_judgment');
  const [hasAttorney, setHasAttorney] = useState<boolean>(true);
  const [debtorCount, setDebtorCount] = useState<number>(1);
  const [noticeType, setNoticeType] = useState<NoticeType>('postal');

  const [copied, setCopied] = useState<boolean>(false);

  const result = useMemo(() => {
    return calculateEnforcementCost({
      claimAmount,
      enforcementType,
      hasAttorney,
      debtorCount,
      noticeType,
    });
  }, [claimAmount, enforcementType, hasAttorney, debtorCount, noticeType]);

  const copySummary = () => {
    navigator.clipboard.writeText(result.legalSummary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const applyPreset = (amount: number, type: EnforcementType) => {
    setClaimAmount(amount);
    setEnforcementType(type);
  };

  return (
    <div className="space-y-8">
      {/* Parametre Giriş Paneli */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-800 mb-6 gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <FaGavel className="text-blue-400" />
              Türkiye İcra Takibi Açılış Harç ve Masraf Hesaplayıcı
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              2004 s. İcra ve İflas Kanunu ve Harçlar Kanunu (1) sayılı Tarife uyarınca UYAP icra takip açılış masraf dökümü.
            </p>
          </div>

          {/* Hızlı Alacak Presetleri */}
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => applyPreset(25000, 'without_judgment')}
              className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            >
              Fatura / Cari (25.000 TL)
            </button>
            <button
              type="button"
              onClick={() => applyPreset(100000, 'without_judgment')}
              className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            >
              Kira / Senet (100.000 TL)
            </button>
            <button
              type="button"
              onClick={() => applyPreset(250000, 'with_judgment')}
              className="px-2.5 py-1 text-xs font-medium rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 transition"
            >
              Mahkeme İlamı (250.000 TL)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Asıl Alacak Tutarı */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Asıl Alacak Tutarı (TL)
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="5000"
                value={claimAmount}
                onChange={(e) => setClaimAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-base font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="absolute right-4 top-2.5 text-slate-400 font-bold">₺</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Takip talebine konu asıl alacak</p>
          </div>

          {/* Takip Türü */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              İcra Takip Türü
            </label>
            <select
              value={enforcementType}
              onChange={(e) => setEnforcementType(e.target.value as EnforcementType)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="without_judgment">İlamsız İcra (Örnek No: 7 - %0.5 Peşin Harçlı)</option>
              <option value="with_judgment">İlamlı İcra (Mahkeme Kararı / İlam - Peşin Harçsız)</option>
            </select>
            <p className="text-[11px] text-slate-500 mt-1">İlamlı takiplerde binde 5 peşin harç alınmaz</p>
          </div>

          {/* Borçlu Sayısı */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Borçlu Sayısı
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                max="50"
                value={debtorCount}
                onChange={(e) => setDebtorCount(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="absolute right-4 top-2.5 text-slate-400 text-xs flex items-center gap-1">
                <FaUsers /> Kişi
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Her borçlu için ayrı tebligat düzenlenir</p>
          </div>
        </div>

        {/* Seçenekler: Vekalet & Tebligat Türü */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-slate-800">
          <div>
            <label className="flex items-center gap-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800 cursor-pointer hover:border-slate-700 transition">
              <input
                type="checkbox"
                checked={hasAttorney}
                onChange={(e) => setHasAttorney(e.target.checked)}
                className="rounded bg-slate-800 border-slate-700 text-blue-500 focus:ring-blue-500 w-4 h-4"
              />
              <div className="text-xs">
                <span className="font-semibold text-white flex items-center gap-1.5">
                  <FaUserTie className="text-blue-400" />
                  Avukat Aracılığıyla Takip Açılıyor
                </span>
                <span className="text-slate-400 text-[11px]">
                  Vekalet Harcı (60,80 TL) ve Baro Pulu (96,00 TL) dahil edilir
                </span>
              </div>
            </label>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1">
              <FaEnvelope className="text-blue-400" /> Tebligat Yöntemi
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setNoticeType('postal')}
                className={`py-2 px-3 text-xs font-medium rounded-xl border text-center transition ${
                  noticeType === 'postal'
                    ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                Fiziksel PTT (200 TL / borçlu)
              </button>
              <button
                type="button"
                onClick={() => setNoticeType('electronic')}
                className={`py-2 px-3 text-xs font-medium rounded-xl border text-center transition ${
                  noticeType === 'electronic'
                    ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                UETS Elektronik (15 TL / borçlu)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sonuç Gösterge Paneli */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ana Açılış Masrafı Kartı */}
        <div className="lg:col-span-1 bg-gradient-to-br from-blue-950/40 via-slate-900 to-slate-900 border border-blue-500/30 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-blue-400 text-sm font-semibold mb-2">
              <span>PEŞİN YATIRILACAK AÇILIŞ MASRAFI</span>
              <FaFileInvoiceDollar />
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              ₺{result.totalOpeningCost.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Takip açılışında UYAP / icra veznesine peşin olarak depo edilmesi zorunlu harç ve masraflar toplamıdır.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/80 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Takip Çıkışı Tutarı (Alacak + Masraf):</span>
              <span className="font-bold text-emerald-400 font-mono text-sm">
                ₺{result.totalClaimWithCost.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center text-[11px] text-slate-500">
              <span>Takip Türü:</span>
              <span>{result.enforcementTypeName}</span>
            </div>
          </div>
        </div>

        {/* Masraf Kalemleri Tablosu */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <FaBalanceScale className="text-blue-400" />
            Harç ve Masraf Kalemleri Dağılımı (492 s.K. 1 Sayılı Tarife)
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider">
                  <th className="py-2.5 px-3">Masraf Kalemi</th>
                  <th className="py-2.5 px-3">Yasal Açıklama</th>
                  <th className="py-2.5 px-3 text-right">Tutar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {result.feeItems.map((item) => (
                  <tr key={`fee-${item.code}`} className="hover:bg-slate-800/40 transition">
                    <td className="py-2.5 px-3 font-semibold text-white whitespace-nowrap">
                      {item.name}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">
                      {item.description}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold font-mono">
                      {item.isExempt ? (
                        <span className="text-emerald-400 font-normal">Muaf (0,00 ₺)</span>
                      ) : (
                        <span className="text-slate-200">
                          ₺{item.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-slate-700 font-bold text-white text-sm">
                  <td colSpan={2} className="py-3 px-3">TOPLAM AÇILIŞ HARÇ VE MASRAFI</td>
                  <td className="py-3 px-3 text-right text-blue-400 font-mono">
                    ₺{result.totalOpeningCost.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {/* Rapor & Dilekçe / Takip Talebi Metni */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-md font-bold text-white flex items-center gap-2">
            <FaGavel className="text-blue-400" />
            UYAP Takip Talebi & Masraf Açıklama Metni
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

      {/* REST API Bilgi Notu */}
      <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-4 text-xs text-slate-400 flex items-start gap-3">
        <FaInfoCircle className="text-blue-400 text-base mt-0.5 shrink-0" />
        <div>
          <span className="text-slate-200 font-semibold">Hukuk Yazılımları & Tahsilat Sistemleri için REST API:</span>{' '}
          İcra takip açılış harçlarını otomatik hesaplamak için{' '}
          <code className="text-blue-300 bg-slate-800 px-1.5 py-0.5 rounded font-mono">
            POST /api/v1/legal/enforcement-cost
          </code>{' '}
          uç noktasını entegre edebilirsiniz.
        </div>
      </div>
    </div>
  );
}
