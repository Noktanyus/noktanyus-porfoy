'use client';

import { useState, useEffect, useId } from 'react';
import Link from 'next/link';
import {
  FaQrcode,
  FaCheck,
  FaCopy,
  FaDownload,
  FaArrowLeft,
  FaInfoCircle,
  FaShieldAlt,
  FaExternalLinkAlt,
  FaMoneyBillWave,
  FaBuilding,
  FaMobileAlt,
} from 'react-icons/fa';
import {
  buildTrQrString,
  parseTrQrString,
  generateTrQrDataUrl,
  generateTrQrSvg,
  type TrQrBuildResult,
  type TrQrParseResult,
} from '@/modules/tr-api/trQr';
import { validateIban, IBAN_BANKS } from '@/modules/tr-api/validators';
import { TrackRecentTool } from '@/components/tools/TrackRecentTool';

const SAMPLE_PAYEES = [
  { label: 'E-Ticaret Sipariş', iban: 'TR330006100519786457841326', name: 'Noktanyus E-Ticaret', amount: '250.00', ref: 'SIP-2026-99' },
  { label: 'Serbest Meslek Danışmanlık', iban: 'TR640001001234567890123456', name: 'Yunus Tuğhan', amount: '5000.00', ref: 'SMM-104' },
  { label: 'Restoran / Kafe Masa', iban: 'TR150006200000012345678901', name: 'Karaköy Bistro', amount: '', ref: 'MASA-12' },
];

export default function TrQrToolClient() {
  const [activeTab, setActiveTab] = useState<'create' | 'parse'>('create');

  // Generator State
  const [iban, setIban] = useState<string>('TR330006100519786457841326');
  const [payeeName, setPayeeName] = useState<string>('Noktanyus Teknoloji');
  const [amount, setAmount] = useState<string>('150.00');
  const [reference, setReference] = useState<string>('SIP-10492');
  const [city, setCity] = useState<string>('ISTANBUL');

  // Preview & Rendered QR
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [qrSvg, setQrSvg] = useState<string>('');
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [copiedPayload, setCopiedPayload] = useState(false);

  // Parser State
  const [parseInput, setParseInput] = useState<string>('');
  const [parseResult, setParseResult] = useState<TrQrParseResult | null>(null);

  // Generate QR on change
  const buildResult: TrQrBuildResult = buildTrQrString({
    iban,
    payeeName,
    amount: amount ? amount : undefined,
    reference: reference ? reference : undefined,
    city,
  });

  const cleanIban = iban.trim().replace(/\s+/g, '').toUpperCase();
  const ibanValidation = validateIban(cleanIban);
  const bankCode = cleanIban.length >= 9 ? cleanIban.slice(4, 9) : null;
  const bankName = bankCode ? IBAN_BANKS[bankCode] : null;

  useEffect(() => {
    let isCurrent = true;
    generateTrQrDataUrl({
      iban,
      payeeName,
      amount: amount ? amount : undefined,
      reference: reference ? reference : undefined,
      city,
    })
      .then((url) => {
        if (isCurrent) setQrDataUrl(url);
      })
      .catch(() => {});

    generateTrQrSvg({
      iban,
      payeeName,
      amount: amount ? amount : undefined,
      reference: reference ? reference : undefined,
      city,
    })
      .then((svg) => {
        if (isCurrent) setQrSvg(svg);
      })
      .catch(() => {});

    return () => {
      isCurrent = false;
    };
  }, [iban, payeeName, amount, reference, city]);

  const handleCopyCurl = () => {
    const curl = `curl -X POST "https://noktanyus.com/api/v1/pay/tr-qr/generate" \\\n  -H "x-api-key: YOUR_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{"iban":"${cleanIban}","payeeName":"${payeeName}","amount":${amount ? parseFloat(amount) : 'null'},"reference":"${reference}","city":"${city}"}'`;
    navigator.clipboard.writeText(curl);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(buildResult.payload);
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  const handleDownloadSvg = () => {
    if (!qrSvg) return;
    const blob = new Blob([qrSvg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TR-KAREKOD-${reference || 'FAST'}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPng = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `TR-KAREKOD-${reference || 'FAST'}.png`;
    a.click();
  };

  const handleParse = (text: string) => {
    setParseInput(text);
    if (!text.trim()) {
      setParseResult(null);
      return;
    }
    const result = parseTrQrString(text.trim());
    setParseResult(result);
  };

  return (
    <div className="section-glass-hero bg-blob-decoration py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      <TrackRecentTool slug="tr-karekod-olusturucu" title="TR Karekod (FAST)" />

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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <FaQrcode className="w-3 h-3" />
            <span>TCMB & BKM EMVCo Resmi Standartları</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white">
            TCMB TR Karekod (FAST / Havale) Oluşturucu & Çözücü
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
            TCMB TR-QR FAST standardında banka mobil uygulamalarıyla (Garanti, İşCep, Ziraat, Akbank vb.) 
            taranabilir ödeme karekodu oluşturun veya taranmış bir karekodun doğruluğunu test edin.
          </p>
        </header>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 sm:gap-4 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className={`py-3 px-3.5 sm:px-4 font-semibold text-xs sm:text-sm rounded-t-xl transition-all border-b-2 flex items-center gap-2 whitespace-nowrap shrink-0 ${
              activeTab === 'create'
                ? 'border-brand-primary text-brand-primary bg-brand-primary/5'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FaQrcode className="w-4 h-4 shrink-0" />
            <span>Karekod Oluştur</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('parse')}
            className={`py-3 px-3.5 sm:px-4 font-semibold text-xs sm:text-sm rounded-t-xl transition-all border-b-2 flex items-center gap-2 whitespace-nowrap shrink-0 ${
              activeTab === 'parse'
                ? 'border-brand-primary text-brand-primary bg-brand-primary/5'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FaShieldAlt className="w-4 h-4 shrink-0" />
            <span>Karekod Çöz & Doğrula</span>
          </button>
        </div>

        {/* TAB 1: CREATE TR-QR */}
        {activeTab === 'create' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Form Column */}
            <div className="lg:col-span-7 space-y-5 p-6 sm:p-8 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xl backdrop-blur-sm">
              {/* Sample Templates */}
              <div>
                <span className="block text-xs font-bold text-slate-500 mb-2">Hızlı Şablonlar:</span>
                <div className="flex flex-wrap gap-2">
                  {SAMPLE_PAYEES.map((tmpl) => (
                    <button
                      key={tmpl.label}
                      type="button"
                      onClick={() => {
                        setIban(tmpl.iban);
                        setPayeeName(tmpl.name);
                        setAmount(tmpl.amount);
                        setReference(tmpl.ref);
                      }}
                      className="px-2.5 py-1 text-xs rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-brand-primary/10 hover:text-brand-primary transition-colors border border-slate-200 dark:border-slate-700"
                    >
                      {tmpl.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* IBAN Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="qr-iban" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    TR IBAN Numarası:
                  </label>
                  {bankName && (
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <FaBuilding className="w-3 h-3" />
                      <span>{bankName}</span>
                    </span>
                  )}
                </div>
                <input
                  id="qr-iban"
                  type="text"
                  value={iban}
                  onChange={(e) => setIban(e.target.value)}
                  placeholder="TR00 0000 0000 0000 0000 0000 00"
                  className={`w-full px-4 py-2.5 font-mono text-base rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none transition-all ${
                    ibanValidation.valid
                      ? 'border-emerald-500/80 focus:ring-2 focus:ring-emerald-500'
                      : 'border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-brand-primary'
                  }`}
                />
                {!ibanValidation.valid && iban.length > 5 && (
                  <span className="text-xs text-amber-500 mt-1 block">
                    {ibanValidation.reason || 'Geçerli bir TR IBAN giriniz'}
                  </span>
                )}
              </div>

              {/* Payee Name */}
              <div>
                <label htmlFor="qr-payee" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Alıcı Adı / Ticari Ünvan (Maks 25 karakter):
                </label>
                <input
                  id="qr-payee"
                  type="text"
                  maxLength={25}
                  value={payeeName}
                  onChange={(e) => setPayeeName(e.target.value)}
                  placeholder="Örn: YUNUS TUGHAN"
                  className="w-full px-4 py-2.5 text-base rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-primary outline-none transition-all"
                />
              </div>

              {/* Amount & Reference Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="qr-amount" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Tutar (TL - Opsiyonel):
                  </label>
                  <input
                    id="qr-amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Boş bırakılırsa tutarsız"
                    className="w-full px-4 py-2.5 font-mono text-base rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-primary outline-none transition-all"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    {amount ? 'Dinamik Sabit Tutarlı' : 'Statik (Müşteri tutarı girer)'}
                  </span>
                </div>

                <div>
                  <label htmlFor="qr-ref" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Sipariş / Fatura No / Açıklama:
                  </label>
                  <input
                    id="qr-ref"
                    type="text"
                    maxLength={25}
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="Örn: SIP-10492"
                    className="w-full px-4 py-2.5 text-base rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-primary outline-none transition-all"
                  />
                </div>
              </div>

              {/* City Input */}
              <div>
                <label htmlFor="qr-city" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Şehir (Maks 15 karakter):
                </label>
                <input
                  id="qr-city"
                  type="text"
                  maxLength={15}
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="ISTANBUL"
                  className="w-full px-4 py-2.5 text-base rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-primary outline-none transition-all"
                />
              </div>

              {/* cURL API banner */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  REST API: <code className="font-mono text-brand-primary">POST /api/v1/pay/tr-qr/generate</code>
                </span>
                <button
                  type="button"
                  onClick={handleCopyCurl}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                >
                  {copiedCurl ? <FaCheck className="text-emerald-500" /> : <FaCopy />}
                  <span>{copiedCurl ? 'cURL Kopyalandı' : 'cURL Kopyala'}</span>
                </button>
              </div>
            </div>

            {/* Preview Column */}
            <div className="lg:col-span-5 flex flex-col justify-between p-6 sm:p-8 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xl backdrop-blur-sm text-center">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 mb-4">
                  {buildResult.type === 'dynamic' ? 'Dinamik (Sabit Tutarlı)' : 'Statik TR Karekod'}
                </div>

                {/* QR Code Container */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-md inline-block mx-auto max-w-[260px]">
                  {qrDataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={qrDataUrl}
                      alt="TCMB TR Karekod FAST"
                      className="w-full h-auto rounded-lg"
                    />
                  ) : (
                    <div className="w-56 h-56 flex items-center justify-center bg-slate-100 rounded-lg text-slate-400 text-sm">
                      Karekod üretiliyor...
                    </div>
                  )}
                </div>

                {/* Info block under QR */}
                <div className="mt-4 space-y-1">
                  <div className="text-sm font-bold text-slate-900 dark:text-white">
                    {buildResult.payeeName}
                  </div>
                  {buildResult.amount ? (
                    <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                      ₺{buildResult.amount}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500">Tutar: Müşteri belirleyecek</div>
                  )}
                  {buildResult.reference && (
                    <div className="text-xs font-mono text-slate-500">
                      Ref: {buildResult.reference}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-center gap-1 text-xs text-slate-500 mt-3">
                  <FaMobileAlt className="w-3.5 h-3.5 text-brand-primary" />
                  <span>Banka uygulamanızın <strong>"Karekod ile Öde"</strong> menüsüyle test edin</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 space-y-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadSvg}
                    disabled={!qrSvg}
                    className="flex items-center justify-center gap-2 py-2.5 px-3 text-xs font-bold rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 transition-opacity"
                  >
                    <FaDownload className="w-3 h-3" />
                    <span>SVG İndir</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadPng}
                    disabled={!qrDataUrl}
                    className="flex items-center justify-center gap-2 py-2.5 px-3 text-xs font-bold rounded-xl bg-brand-primary text-white hover:bg-brand-primary-hover transition-colors shadow-md"
                  >
                    <FaDownload className="w-3 h-3" />
                    <span>PNG İndir</span>
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleCopyPayload}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                >
                  {copiedPayload ? <FaCheck className="text-emerald-500" /> : <FaCopy />}
                  <span>{copiedPayload ? 'Ham String Kopyalandı' : 'EMVCo Raw Payload Kopyala'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PARSE & VALIDATE TR-QR */}
        {activeTab === 'parse' && (
          <div className="p-6 sm:p-8 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xl backdrop-blur-sm space-y-6">
            <div>
              <label htmlFor="parse-qr-input" className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                TR Karekod Metnini / Payload'unu Yapıştırın:
              </label>
              <textarea
                id="parse-qr-input"
                rows={4}
                value={parseInput}
                onChange={(e) => handleParse(e.target.value)}
                placeholder="Örn: 00020101021226460016tr.gov.tcmb.fast0126TR3300061005197864578413265204000053039495406150.005802TR5919NOKTANYUS TEKNOLOJI6008ISTANBUL62150511SIP-104926304ABCD"
                className="w-full p-4 font-mono text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-primary outline-none transition-all"
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-slate-500">
                  Telefon kamerası veya barkod okuyucu ile okunan ham EMVCo metnini yapıştırabilirsiniz.
                </span>
                <button
                  type="button"
                  onClick={() => handleParse(buildResult.payload)}
                  className="text-xs text-brand-primary font-semibold hover:underline"
                >
                  Oluşturulan Karekodu Çözümle
                </button>
              </div>
            </div>

            {/* Parse Results */}
            {parseResult && (
              <div className="mt-6 p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                        parseResult.valid
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                      }`}
                    >
                      {parseResult.valid ? 'Geçerli TR Karekod' : 'Geçersiz / Tahrif Edilmiş'}
                    </span>
                    <span className="text-xs text-slate-500">
                      CRC Kontrolü: <strong>{parseResult.crcValid ? 'Başarılı' : 'Hatalı'}</strong>
                    </span>
                  </div>
                  <span className="text-xs font-mono text-slate-500">
                    Mod: {parseResult.type === 'dynamic' ? 'Dinamik (Sabit Tutar)' : 'Statik'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <span className="text-xs text-slate-500 block mb-1">Alıcı Ünvanı</span>
                    <span className="text-base font-bold text-slate-900 dark:text-white">
                      {parseResult.payeeName || 'Belirtilmedi'}
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <span className="text-xs text-slate-500 block mb-1">Tutar & Para Birimi</span>
                    <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                      {parseResult.amount !== null ? `₺${parseResult.amount.toFixed(2)}` : 'Tutarsız'} ({parseResult.currency || 'TRY'})
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <span className="text-xs text-slate-500 block mb-1">Sipariş / Referans</span>
                    <span className="text-base font-mono font-bold text-slate-900 dark:text-white">
                      {parseResult.reference || 'Yok'}
                    </span>
                  </div>

                  <div className="sm:col-span-2 md:col-span-3 p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <span className="text-xs text-slate-500 block mb-1">FAST IBAN Numarası</span>
                    <span className="text-sm sm:text-base font-mono font-bold text-brand-primary break-all">
                      {parseResult.iban || 'Yok'}
                    </span>
                    <span className="text-xs text-slate-500 block mt-1">
                      IBAN MOD-97 Doğrulaması: {parseResult.ibanValid ? '✅ Geçerli' : '❌ Geçersiz'}
                    </span>
                  </div>
                </div>

                {/* Raw Tags */}
                <div>
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-2">
                    EMVCo Tag Dökümü:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {Object.entries(parseResult.rawTags).map(([tag, val]) => (
                      <div
                        key={tag}
                        className="p-2 rounded bg-slate-100 dark:bg-slate-900 font-mono text-[11px] truncate border border-slate-200 dark:border-slate-800"
                        title={`Tag ${tag}: ${val}`}
                      >
                        <strong>Tag {tag}:</strong> {val}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Informational SEO Content Box */}
        <div className="p-6 sm:p-8 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            TCMB TR Karekod (TR-QR) Nedir ve Nasıl Çalışır?
          </h2>
          <div className="prose prose-sm dark:prose-invert max-w-none text-slate-600 dark:text-slate-400 space-y-3 leading-relaxed">
            <p>
              Türkiye Cumhuriyet Merkez Bankası (TCMB) ve BKM tarafından zorunlu kılınan <strong>TR Karekod</strong>, 
              uluslararası <strong>EMVCo QR Code</strong> standardını temel alan ulusal ödeme karekodudur. FAST (Fonların Anlık ve Sürekli Transferi) 
              altyapısıyla doğrudan entegre çalışır.
            </p>
            <p>
              Geleneksel havale/EFT işlemlerinde müşterilerin 26 haneli IBAN'ı elle kopyalaması, tutarı yazması ve açıklama kısmına 
              sipariş numarasını girmeyi unutması e-ticarette sipariş onaylarını geciktirir. TR Karekod ile müşteri kendi bankasının 
              (İşCep, Garanti BBVA, Akbank, Ziraat, Yapı Kredi vb.) mobil uygulamasından kamerayı okuttuğu anda tüm bilgiler kuruşuna kadar 
              otomatik doldurulur ve para anında transfer edilir.
            </p>
            <h3 className="text-base font-bold text-slate-900 dark:text-white pt-2">
              E-Ticaret ve Fatura Sistemleri İçin REST API Entegrasyonu
            </h3>
            <p>
              Noktanyus TR Karekod API'si (<code className="text-brand-primary">POST /api/v1/pay/tr-qr/generate</code>) ile 
              WooCommerce, Shopify TR, ERP veya e-arşiv fatura yazılımlarınızda sipariş başına tek satır kodla dinamik karekod 
              (SVG veya PNG) üretebilirsiniz.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
