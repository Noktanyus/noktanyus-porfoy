'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  FaGlobeAmericas,
  FaCheckCircle,
  FaExclamationTriangle,
  FaCalculator,
  FaMoneyBillWave,
  FaPercent,
  FaShippingFast,
  FaHeadphones,
  FaCopy,
  FaCheck,
  FaInfoCircle,
  FaShieldAlt,
} from 'react-icons/fa';
import {
  calculateCustomsTax,
  CUSTOMS_LIMITS,
  type CustomsTaxInput,
} from '@/modules/tr-api/customsTax';

export default function CustomsTaxToolClient() {
  const [productPrice, setProductPrice] = useState<number>(24);
  const [currency, setCurrency] = useState<'EUR' | 'USD' | 'TRY'>('EUR');
  const [origin, setOrigin] = useState<'EU' | 'NON_EU'>('NON_EU');
  const [includeShipping, setIncludeShipping] = useState<boolean>(false);
  const [shippingFee, setShippingFee] = useState<number>(0);
  const [isSctApplied, setIsSctApplied] = useState<boolean>(false);
  const [eurRate, setEurRate] = useState<number>(38.5);
  const [usdToEur, setUsdToEur] = useState<number>(0.92);
  const [showAdvancedRates, setShowAdvancedRates] = useState<boolean>(false);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const result = useMemo(() => {
    return calculateCustomsTax({
      productPrice,
      currency,
      origin,
      includeShippingInCustomsValue: includeShipping,
      shippingFee,
      isSpecialConsumptionTaxApplied: isSctApplied,
      eurExchangeRate: eurRate,
      usdToEurRate: usdToEur,
    });
  }, [
    productPrice,
    currency,
    origin,
    includeShipping,
    shippingFee,
    isSctApplied,
    eurRate,
    usdToEur,
  ]);

  const loadPreset = (preset: 'temu_china' | 'amazon_de' | 'over_limit') => {
    if (preset === 'temu_china') {
      setProductPrice(22);
      setCurrency('EUR');
      setOrigin('NON_EU');
      setShippingFee(0);
      setIncludeShipping(false);
      setIsSctApplied(true); // Kulaklık / Elektronik
    } else if (preset === 'amazon_de') {
      setProductPrice(26);
      setCurrency('EUR');
      setOrigin('EU');
      setShippingFee(4);
      setIncludeShipping(true);
      setIsSctApplied(false);
    } else {
      setProductPrice(42);
      setCurrency('EUR');
      setOrigin('NON_EU');
      setShippingFee(5);
      setIncludeShipping(false);
      setIsSctApplied(false);
    }
  };

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const curlExample = `curl -X POST https://noktanyus.com/api/v1/commerce/customs-tax \\
  -H "Content-Type: application/json" \\
  -d '{
    "productPrice": ${productPrice},
    "currency": "${currency}",
    "origin": "${origin}",
    "isSpecialConsumptionTaxApplied": ${isSctApplied},
    "includeShippingInCustomsValue": ${includeShipping},
    "shippingFee": ${shippingFee}
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
          <span className="text-slate-200">Gümrük Vergisi Hesaplama (30 €)</span>
        </div>

        {/* Hero Title */}
        <div className="border-b border-slate-800 pb-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="p-2.5 bg-gradient-to-br from-amber-500 to-rose-600 rounded-xl text-white shadow-lg shadow-amber-500/20">
              <FaGlobeAmericas className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Yurt Dışı Alışveriş Gümrük Vergisi & 30 Avro Sınırı Hesaplama
              </h1>
              <p className="text-slate-400 mt-1 text-sm sm:text-base">
                Ağustos 2024 Cumhurbaşkanı Kararnamesi uyarınca 30 € muafiyet tavanı, AB (%30), Çin/Diğer (%60), ÖTV IV (%20) ve kapıda teslim maliyet motoru.
              </p>
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-slate-800 text-xs">
            <span className="text-slate-400 font-medium">Hızlı Senaryolar:</span>
            <button
              type="button"
              onClick={() => loadPreset('temu_china')}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors"
            >
              🇨🇳 Temu / Çin Kulaklık (22 €)
            </button>
            <button
              type="button"
              onClick={() => loadPreset('amazon_de')}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors"
            >
              🇩🇪 Amazon DE / AB Giyim (26 €)
            </button>
            <button
              type="button"
              onClick={() => loadPreset('over_limit')}
              className="bg-slate-800 hover:bg-slate-700 text-rose-300 px-3 py-1.5 rounded-lg border border-rose-500/30 transition-colors"
            >
              ⚠️ 30 € Sınır Aşımı (42 €)
            </button>
          </div>
        </div>

        {/* Main Layout: 5 Cols Form vs 7 Cols Results */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Form: 5 Cols */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-slate-800/80 backdrop-blur border border-slate-700/80 rounded-2xl p-6 shadow-xl space-y-5">
              <h2 className="text-base font-semibold text-white flex items-center gap-2 border-b border-slate-700/60 pb-3">
                <FaCalculator className="text-amber-400" /> Sipariş ve Paket Parametreleri
              </h2>

              {/* Product Price & Currency */}
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <label className="text-slate-300 font-medium">Ürün Fatura Bedeli</label>
                  <span className="text-xs text-amber-400 font-mono">Limit: 30 Avro</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={productPrice}
                    onChange={(e) => setProductPrice(parseFloat(e.target.value) || 0)}
                    className="col-span-2 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-amber-500"
                    placeholder="Bedel"
                  />
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as any)}
                    className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-medium focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="EUR">EUR (€)</option>
                    <option value="USD">USD ($)</option>
                    <option value="TRY">TRY (₺)</option>
                  </select>
                </div>
                {currency !== 'EUR' && (
                  <p className="text-xs text-slate-400 mt-1 font-mono">
                    ≈ {result.productPriceEur.toFixed(2)} Avro karşılığı
                  </p>
                )}
              </div>

              {/* Origin Selection */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Menşe / Çıkış Ülkesi (Gümrük Tarifesi)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setOrigin('NON_EU')}
                    className={`p-3 rounded-xl border text-left text-xs transition-all ${
                      origin === 'NON_EU'
                        ? 'bg-amber-500/20 border-amber-500 text-white font-semibold'
                        : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="font-bold text-sm mb-0.5">Çin, ABD, Diğer</div>
                    <div className="text-[11px] text-amber-400 font-mono">%60 Gümrük Vergisi</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOrigin('EU')}
                    className={`p-3 rounded-xl border text-left text-xs transition-all ${
                      origin === 'EU'
                        ? 'bg-indigo-500/20 border-indigo-500 text-white font-semibold'
                        : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="font-bold text-sm mb-0.5">Avrupa Birliği (AB)</div>
                    <div className="text-[11px] text-indigo-400 font-mono">%30 Gümrük Vergisi</div>
                  </button>
                </div>
              </div>

              {/* SCT (ÖTV IV) Checkbox */}
              <div className="border-t border-slate-700/60 pt-4">
                <label className="flex items-start gap-2.5 text-sm text-slate-300 cursor-pointer bg-slate-900/60 p-3 rounded-xl border border-slate-700/60">
                  <input
                    type="checkbox"
                    checked={isSctApplied}
                    onChange={(e) => setIsSctApplied(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-amber-600 focus:ring-amber-500 bg-slate-800 border-slate-600"
                  />
                  <span>
                    <strong className="text-white block text-xs flex items-center gap-1.5">
                      <FaHeadphones className="text-purple-400" /> ÖTV IV Sayılı Liste Eşyası (+%20 Ek Vergi)
                    </strong>
                    <span className="text-xs text-slate-400">
                      Kulaklık, hoparlör, oyun konsolu, MP3 çalar, video/kamera ve lüks tüketim eşyaları.
                    </span>
                  </span>
                </label>
              </div>

              {/* Shipping Options */}
              <div className="border-t border-slate-700/60 pt-4 space-y-3">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeShipping}
                    onChange={(e) => setIncludeShipping(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-600 bg-slate-800 border-slate-600"
                  />
                  <span>Kargo ücreti gümrük matrahına (faturaya) dahil edilsin</span>
                </label>

                {includeShipping && (
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Kargo Ücreti ({currency})</label>
                    <input
                      type="number"
                      min="0"
                      value={shippingFee}
                      onChange={(e) => setShippingFee(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-sm"
                    />
                  </div>
                )}
              </div>

              {/* Advanced Exchange Rates Toggle */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdvancedRates(!showAdvancedRates)}
                  className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1"
                >
                  {showAdvancedRates ? '▲ Kurları Gizle' : '▼ Özel EUR/TRY Kuru ve Parite Düzenle'}
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
          </div>

          {/* Right Results: 7 Cols */}
          <div className="lg:col-span-7 space-y-6">
            {/* Status Banner */}
            <div
              className={`rounded-2xl p-6 border shadow-xl transition-all ${
                !result.isExceeding30EurLimit
                  ? 'bg-gradient-to-br from-emerald-950/40 via-slate-800/80 to-slate-900 border-emerald-500/40'
                  : 'bg-gradient-to-br from-rose-950/40 via-slate-800/80 to-slate-900 border-rose-500/40'
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`p-3 rounded-xl shrink-0 ${
                    !result.isExceeding30EurLimit
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-rose-500/20 text-rose-400'
                  }`}
                >
                  {!result.isExceeding30EurLimit ? (
                    <FaCheckCircle className="w-8 h-8" />
                  ) : (
                    <FaExclamationTriangle className="w-8 h-8" />
                  )}
                </div>
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                        !result.isExceeding30EurLimit
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      {!result.isExceeding30EurLimit
                        ? '✅ 30 Avro Muafiyet Sınırı İçinde'
                        : '⚠️ 30 Avro Limiti Aşıldı (Ticari İthalat)'}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      Gümrük Kıymeti: {result.customsValueEur.toFixed(2)} €
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white">
                    {!result.isExceeding30EurLimit
                      ? 'Basitleştirilmiş Hızlı Kargo İle Teslim Edilebilir'
                      : 'Bireysel Muafiyet Dışında Kalır!'}
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed">{result.statusMessageTr}</p>
                </div>
              </div>

              {/* 30 Euro Limit Progress Bar */}
              <div className="mt-6 pt-5 border-t border-slate-700/60 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">30 Avro Limit Kullanımı</span>
                  <span
                    className={`font-mono font-bold ${
                      !result.isExceeding30EurLimit ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {result.customsValueEur.toFixed(2)} € / 30.00 €
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      !result.isExceeding30EurLimit ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                    style={{
                      width: `${Math.min(100, (result.customsValueEur / 30) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Financial Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Total Tax Payable */}
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-lg space-y-2">
                <span className="text-xs text-rose-400 font-medium flex items-center gap-1.5 uppercase">
                  <FaMoneyBillWave /> Toplam Gümrük Vergisi & Masraflar
                </span>
                <div className="text-2xl font-bold text-rose-400 font-mono">
                  {result.totalTaxPayableTry.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                </div>
                <p className="text-xs text-slate-400">
                  Vergi + ÖTV + Sunum Harcı + Damga Pulu
                </p>
              </div>

              {/* Total Landed Cost */}
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-lg space-y-2">
                <span className="text-xs text-indigo-400 font-medium flex items-center gap-1.5 uppercase">
                  <FaShippingFast /> Kapıda Toplam Maliyet (Landed Cost)
                </span>
                <div className="text-2xl font-bold text-white font-mono">
                  {result.totalLandedCostTry.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                </div>
                <p className="text-xs text-slate-400">
                  Ürün Bedeli + Vergiler toplamı (Cebinizden çıkacak)
                </p>
              </div>
            </div>

            {/* Detailed Itemized Tax Table */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-xl space-y-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2 border-b border-slate-700/60 pb-3">
                <FaPercent className="text-amber-400" /> Vergi Kalemleri Dökümü
              </h3>

              <div className="space-y-2.5 text-xs font-mono">
                <div className="flex justify-between p-2.5 bg-slate-900/60 rounded-xl border border-slate-700/50">
                  <span className="text-slate-300 font-sans">
                    Gümrük Vergisi ({origin === 'EU' ? 'AB %30' : 'Çin/Diğer %60'})
                  </span>
                  <span className="font-bold text-white">
                    {result.dutyAmountEur.toFixed(2)} € ({result.dutyAmountTry.toFixed(2)} ₺)
                  </span>
                </div>

                {isSctApplied && (
                  <div className="flex justify-between p-2.5 bg-slate-900/60 rounded-xl border border-slate-700/50">
                    <span className="text-purple-300 font-sans">
                      Özel Tüketim Vergisi (ÖTV IV Sayılı Liste %20)
                    </span>
                    <span className="font-bold text-purple-400">
                      {result.sctAmountEur.toFixed(2)} € ({result.sctAmountTry.toFixed(2)} ₺)
                    </span>
                  </div>
                )}

                <div className="flex justify-between p-2.5 bg-slate-900/60 rounded-xl border border-slate-700/50">
                  <span className="text-slate-300 font-sans">Gümrük Sunum Ücreti (Muayene / PTT)</span>
                  <span className="text-slate-200">{result.presentationFeeTry.toFixed(2)} ₺</span>
                </div>

                <div className="flex justify-between p-2.5 bg-slate-900/60 rounded-xl border border-slate-700/50">
                  <span className="text-slate-300 font-sans">Damga Pulu Vergisi</span>
                  <span className="text-slate-200">{result.stampTaxTry.toFixed(2)} ₺</span>
                </div>

                <div className="flex justify-between p-3 bg-amber-500/10 rounded-xl border border-amber-500/30 text-amber-300 font-sans font-bold">
                  <span>Efektif Vergi Yükü Oranı</span>
                  <span className="font-mono">%{result.effectiveTaxRatioPercent}</span>
                </div>
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
          </div>
        </div>

        {/* Legal decree & FAQ section */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FaInfoCircle className="text-amber-400" /> Ağustos 2024 Kararnamesi ve Gümrük Mevzuatı
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-slate-300">
            <div className="space-y-2 bg-slate-900/60 p-4 rounded-xl border border-slate-700/50">
              <h3 className="font-semibold text-white">1. 30 Avro sınırı nedir?</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                06 Ağustos 2024 tarihli 32624 sayılı Resmi Gazete’de yayımlanan 8787 sayılı Cumhurbaşkanı Kararı ile bireysel posta ve hızlı kargo yoluyla yurt dışından gelen eşyalarda vergisiz basitleştirilmiş gümrükleme tavanı 150 Avro’dan 30 Avro’ya indirilmiştir.
              </p>
            </div>

            <div className="space-y-2 bg-slate-900/60 p-4 rounded-xl border border-slate-700/50">
              <h3 className="font-semibold text-white">2. Güncel vergi oranları nelerdir?</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Avrupa Birliği ülkelerinden doğrudan gelen siparişlerde maktu gümrük vergisi %18’den %30’a; Çin (Temu, AliExpress), ABD ve diğer ülkelerden gelenlerde ise %30’dan %60’a yükseltilmiştir.
              </p>
            </div>

            <div className="space-y-2 bg-slate-900/60 p-4 rounded-xl border border-slate-700/50">
              <h3 className="font-semibold text-white">3. ÖTV IV Sayılı Liste nedir?</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Siparişiniz kulaklık, kablosuz hoparlör, televizyon alıcısı, oyun konsolu vb. tüketici elektroniği ürünlerini içeriyorsa, gümrük vergisinin üzerine ilave %20 ÖTV eklenir.
              </p>
            </div>

            <div className="space-y-2 bg-slate-900/60 p-4 rounded-xl border border-slate-700/50">
              <h3 className="font-semibold text-white">4. 30 Avro aşılırsa ne olur?</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Kargonuz basitleştirilmiş bireysel gümrükleme kapsamından çıkarak ticari ithalat sayılır. Paketi çekebilmek için gümrük müşaviri tutulması, ordino ücreti, ardiye ücreti ve detaylı ithalat beyannamesi vergileri ödenmesi gerekir.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
