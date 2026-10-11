'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  FaArrowLeft,
  FaCalculator,
  FaFileInvoice,
  FaExclamationTriangle,
  FaCheckCircle,
  FaSearch,
  FaCopy,
  FaCheck,
  FaInfoCircle,
  FaBuilding,
  FaUser,
  FaShieldAlt,
} from 'react-icons/fa';
import TrackRecentTool from '@/components/tools/TrackRecentTool';
import {
  checkEArchiveRequirement,
  searchVatExemptionCodes,
  OFFICIAL_THRESHOLDS,
  type EArchiveThresholdInput,
  type VatExemptionCode,
} from '@/modules/tr-api/eArchiveRules';

export default function EArchiveRulesToolClient() {
  const [totalAmount, setTotalAmount] = useState<number>(6500);
  const [recipientType, setRecipientType] = useState<'taxpayer' | 'consumer'>('taxpayer');
  const [sameDayPrevious, setSameDayPrevious] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [copiedCurl, setCopiedCurl] = useState<boolean>(false);

  const thresholdInput: EArchiveThresholdInput = useMemo(() => {
    return {
      totalAmountIncludingVat: Number(totalAmount) || 0,
      recipientType,
      sameDayPreviousInvoicesTotal: Number(sameDayPrevious) || 0,
    };
  }, [totalAmount, recipientType, sameDayPrevious]);

  const thresholdResult = useMemo(() => {
    return checkEArchiveRequirement(thresholdInput);
  }, [thresholdInput]);

  const exemptionCodes = useMemo(() => {
    return searchVatExemptionCodes(searchQuery, selectedCategory);
  }, [searchQuery, selectedCategory]);

  const curlCommand = useMemo(() => {
    const payload = JSON.stringify(
      {
        totalAmountIncludingVat: thresholdInput.totalAmountIncludingVat,
        recipientType: thresholdInput.recipientType,
        sameDayPreviousInvoicesTotal: thresholdInput.sameDayPreviousInvoicesTotal,
        searchExemptionQuery: searchQuery || undefined,
        exemptionCategory: selectedCategory !== 'all' ? selectedCategory : undefined,
      },
      null,
      2
    );
    return `curl -X POST https://noktanyus.com/api/v1/invoice/e-archive-rules \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '${payload}'`;
  }, [thresholdInput, searchQuery, selectedCategory]);

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      // ignore
    }
  };

  const handleCopyCurl = async () => {
    try {
      await navigator.clipboard.writeText(curlCommand);
      setCopiedCurl(true);
      setTimeout(() => setCopiedCurl(false), 2000);
    } catch {
      // ignore
    }
  };

  const thresholdLimit =
    recipientType === 'taxpayer' ? OFFICIAL_THRESHOLDS.taxpayerLimit : OFFICIAL_THRESHOLDS.consumerLimit;

  return (
    <div className="section-glass-hero bg-blob-decoration py-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      <TrackRecentTool slug="e-arsiv-fatura-limiti-sorgulama" title="e-Arşiv Limiti ve KDV İstisnaları" />

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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            <FaShieldAlt className="w-3 h-3" />
            <span>509 Sıra No'lu VUK Tebliği & GİB Portal Düzenlemeleri</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white">
            GİB e-Arşiv Fatura Limiti & KDV İstisna Kodları Rehberi
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base max-w-3xl">
            Vergi mükelleflerine kesilen faturalarda <strong>5.000 TL</strong>, nihai tüketicilere kesilen faturalarda{' '}
            <strong>3.000 TL</strong> üzeri tutarlarda kağıt fatura kesilmesi yasaktır. Faturanızın zorunluluk durumunu kontrol edin ve
            resmi UBL-TR KDV istisna/muafiyet kodlarını tek tıkla bulun.
          </p>
        </header>

        {/* Section 1: Threshold Calculator */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Inputs Section */}
          <div className="lg:col-span-6 p-6 sm:p-8 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xl backdrop-blur-sm space-y-6">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
              <FaCalculator className="w-4 h-4 text-brand-primary" />
              Fatura Tutar & Alıcı Bilgileri
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Düzenlenecek Fatura Tutarı (KDV Dahil, TL)
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm"
                />
              </div>

              {/* Recipient Type Toggle */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Alıcı Müşteri Statüsü
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRecipientType('taxpayer')}
                    className={`py-2.5 px-4 rounded-xl border text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                      recipientType === 'taxpayer'
                        ? 'border-brand-primary bg-brand-primary/10 text-brand-primary font-bold'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <FaBuilding className="w-4 h-4" />
                    <span>Vergi Mükellefi (5.000 TL Sınır)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecipientType('consumer')}
                    className={`py-2.5 px-4 rounded-xl border text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                      recipientType === 'consumer'
                        ? 'border-brand-primary bg-brand-primary/10 text-brand-primary font-bold'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <FaUser className="w-4 h-4" />
                    <span>Nihai Tüketici (3.000 TL Sınır)</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Aynı Gün Aynı Alıcıya Kesilen Önceki Faturalar Toplamı (Varsa, TL)
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={sameDayPrevious}
                  onChange={(e) => setSameDayPrevious(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  VUK uyarınca aynı günde aynı kişiye kesilen parçalı faturalar toplanarak sınır denetlenir.
                </span>
              </div>
            </div>
          </div>

          {/* Results Summary */}
          <div className="lg:col-span-6 space-y-6">
            {/* Status Alert Banner */}
            <div
              className={`p-6 rounded-2xl border ${
                thresholdResult.isEArchiveMandatory
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-950 dark:text-rose-100'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-100'
              }`}
            >
              <div className="flex items-start gap-3">
                {thresholdResult.isEArchiveMandatory ? (
                  <FaExclamationTriangle className="w-6 h-6 text-rose-500 mt-0.5 shrink-0" />
                ) : (
                  <FaCheckCircle className="w-6 h-6 text-emerald-500 mt-0.5 shrink-0" />
                )}
                <div className="space-y-1.5">
                  <h3 className="font-extrabold text-base sm:text-lg">
                    {thresholdResult.legalNotice.title}
                  </h3>
                  <p className="text-xs sm:text-sm leading-relaxed opacity-90">
                    {thresholdResult.legalNotice.description}
                  </p>
                  <p className="text-xs font-semibold mt-2 pt-2 border-t border-rose-500/20 text-rose-700 dark:text-rose-300">
                    ⚠️ {thresholdResult.legalNotice.penaltyWarning}
                  </p>
                </div>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Değerlendirilen Toplam Tutar
                </span>
                <span className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-1 block">
                  {thresholdResult.evaluatedTotalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                </span>
                <span className="text-xs text-slate-400 mt-1 block">
                  Günlük Kümülatif Matrah
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Uygulanan Yasal Limit
                </span>
                <span className="text-xl sm:text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1 block">
                  {thresholdLimit.toLocaleString('tr-TR')} TL
                </span>
                <span className="text-xs text-slate-400 mt-1 block truncate">
                  {recipientType === 'taxpayer' ? 'Vergi Mükellefi' : 'Nihai Tüketici'}
                </span>
              </div>
            </div>

            {/* Visual Limit Progress Bar */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-slate-600 dark:text-slate-400">Limit Kullanımı</span>
                <span>
                  <strong>%{Math.round((thresholdResult.evaluatedTotalAmount / thresholdLimit) * 100)}</strong>
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    thresholdResult.isEArchiveMandatory ? 'bg-rose-500' : 'bg-emerald-500'
                  }`}
                  style={{
                    width: `${Math.min(100, (thresholdResult.evaluatedTotalAmount / thresholdLimit) * 100)}%`,
                  }}
                />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {thresholdResult.isEArchiveMandatory
                  ? 'Fatura tutarı yasal tavanı aştığı için GİB e-Arşiv Portal üzerinden düzenlenmelidir.'
                  : `Limiti aşmadan kağıt veya e-Arşiv kesebilirsiniz (Kalan güvenli tutar: ${thresholdResult.remainingLimit.toLocaleString('tr-TR')} TL).`}
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: VAT Exemption Codes Catalog */}
        <div className="p-6 sm:p-8 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xl backdrop-blur-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FaFileInvoice className="w-5 h-5 text-brand-primary" />
                Resmi GİB KDV İstisna / Muafiyet Kodları Kataloğu
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                KDV oranı %0 girildiğinde e-Fatura ve e-Arşiv XML'lerinde zorunlu olan resmi istisna neden kodları.
              </p>
            </div>

            {/* Filter buttons */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedCategory === 'all'
                    ? 'bg-brand-primary text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                Tümü
              </button>
              <button
                type="button"
                onClick={() => setSelectedCategory('tam_istisna')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedCategory === 'tam_istisna'
                    ? 'bg-brand-primary text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                Tam İstisna (300'ler)
              </button>
              <button
                type="button"
                onClick={() => setSelectedCategory('kismi_istisna')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedCategory === 'kismi_istisna'
                    ? 'bg-brand-primary text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                Kısmi İstisna (200'ler)
              </button>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="İstisna kodu veya kelime arayın (örn: 301, mal ihracatı, teknokent, serbest bölge)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
            />
          </div>

          {/* Codes List Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {exemptionCodes.map((item) => (
              <div
                key={item.code}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex items-start justify-between gap-3 hover:border-brand-primary/40 transition-all"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                      Kod: {item.code}
                    </span>
                    <span className="text-[11px] text-slate-400">{item.legalArticle}</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {item.description}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyCode(item.code)}
                  className="p-2 rounded-lg text-slate-400 hover:text-brand-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
                  title="Kodu Kopyala"
                >
                  {copiedCode === item.code ? (
                    <FaCheck className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <FaCopy className="w-4 h-4" />
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Developer API Section */}
        <div className="p-6 sm:p-8 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FaFileInvoice className="w-4 h-4 text-brand-primary" />
                Geliştiriciler İçin REST API Entegrasyonu
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                ERP veya e-ticaret fatura kesim entegrasyonunuzda otomatik limit kontrolü için:
              </p>
            </div>
            <button
              onClick={handleCopyCurl}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors shrink-0"
            >
              {copiedCurl ? <FaCheck className="w-3.5 h-3.5 text-emerald-500" /> : <FaCopy className="w-3.5 h-3.5" />}
              <span>{copiedCurl ? 'Kopyalandı' : 'cURL Kopyala'}</span>
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
