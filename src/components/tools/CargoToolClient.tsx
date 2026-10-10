'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  FaTruck,
  FaBox,
  FaBarcode,
  FaCalculator,
  FaCopy,
  FaCheck,
  FaExternalLinkAlt,
  FaArrowLeft,
  FaInfoCircle,
} from 'react-icons/fa';
import {
  TURKISH_CARRIERS,
  detectCargoCarrier,
  calculateCargoDesi,
  buildCargoTrackingUrl,
} from '@/modules/tr-api/cargo';
import { TrackRecentTool } from '@/components/tools/TrackRecentTool';

const SAMPLE_TRACKING_CODES = [
  { label: 'Trendyol Express', code: 'TEX9823481239' },
  { label: 'HepsiJET', code: 'HJ9012384712' },
  { label: 'PTT Kargo', code: 'KP12345678901' },
  { label: 'Yurtiçi Kargo', code: '123456789012' },
  { label: 'Aras Kargo', code: '1234567890123' },
  { label: 'MNG Kargo', code: '987654321' },
];

export default function CargoToolClient() {
  const [activeTab, setActiveTab] = useState<'desi' | 'detect' | 'carriers'>('desi');

  // Desi Calculator State
  const [width, setWidth] = useState<string>('30');
  const [length, setLength] = useState<string>('40');
  const [height, setHeight] = useState<string>('20');
  const [weightKg, setWeightKg] = useState<string>('3.5');
  const [quantity, setQuantity] = useState<string>('1');
  const [divisor, setDivisor] = useState<'3000' | '5000'>('3000');
  const [copiedDesiCurl, setCopiedDesiCurl] = useState(false);

  // Tracking Detection State
  const [trackingInput, setTrackingInput] = useState<string>('');
  const [copiedDetectCurl, setCopiedDetectCurl] = useState(false);

  // Desi Calculation
  const wNum = parseFloat(width) || 0;
  const lNum = parseFloat(length) || 0;
  const hNum = parseFloat(height) || 0;
  const wtNum = parseFloat(weightKg) || 0;
  const qNum = parseInt(quantity, 10) || 1;
  const divNum = parseInt(divisor, 10) as 3000 | 5000;

  const desiResult =
    wNum > 0 && lNum > 0 && hNum > 0
      ? calculateCargoDesi({
          widthCm: wNum,
          lengthCm: lNum,
          heightCm: hNum,
          weightKg: wtNum > 0 ? wtNum : undefined,
          divisor: divNum,
        })
      : null;

  // Multiply by quantity for total views
  const totalDesi = desiResult ? Math.round(desiResult.desi * qNum * 100) / 100 : 0;
  const totalChargeable = desiResult ? Math.round(desiResult.chargeableWeightKg * qNum * 100) / 100 : 0;
  const volumeM3 = desiResult ? (desiResult.volumeCm3 * qNum / 1000000).toFixed(3) : '0';
  const volumeLiters = desiResult ? (desiResult.volumeCm3 * qNum / 1000).toFixed(1) : '0';

  // Tracking Carrier Detection
  const cleanTrackingInput = trackingInput.trim();
  const detectionResult = cleanTrackingInput ? detectCargoCarrier(cleanTrackingInput) : null;

  const handleCopyDesiCurl = () => {
    const curl = `curl -X POST "https://noktanyus.com/api/v1/cargo/desi" \\\n  -H "x-api-key: YOUR_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{"widthCm":${wNum},"lengthCm":${lNum},"heightCm":${hNum},"weightKg":${wtNum},"divisor":${divNum}}'`;
    navigator.clipboard.writeText(curl);
    setCopiedDesiCurl(true);
    setTimeout(() => setCopiedDesiCurl(false), 2000);
  };

  const handleCopyDetectCurl = () => {
    const curl = `curl -X POST "https://noktanyus.com/api/v1/cargo/detect" \\\n  -H "x-api-key: YOUR_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{"trackingNumber":"${cleanTrackingInput}"}'`;
    navigator.clipboard.writeText(curl);
    setCopiedDetectCurl(true);
    setTimeout(() => setCopiedDetectCurl(false), 2000);
  };

  return (
    <div className="section-glass-hero bg-blob-decoration py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      <TrackRecentTool slug="kargo-desi-hesaplama" title="Kargo Desi & Takip" />

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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <FaTruck className="w-3 h-3" />
            <span>Türkiye Lojistik & Kargo Standartları</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white">
            Kargo Desi Hesaplama & Kargo Takip No Tespiti
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
            Türkiye standartlarında (bölücü 3000) hacimsel desi ve faturalandırılacak ücrete esas ağırlığı hesaplayın,
            herhangi bir takip numarasından kargo firmasını anında tespit edin.
          </p>
        </header>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 sm:gap-4 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setActiveTab('desi')}
            className={`py-3 px-4 font-semibold text-sm rounded-t-xl transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'desi'
                ? 'border-brand-primary text-brand-primary bg-brand-primary/5'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FaCalculator className="w-4 h-4" />
            <span>Desi & Ağırlık Hesapla</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('detect')}
            className={`py-3 px-4 font-semibold text-sm rounded-t-xl transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'detect'
                ? 'border-brand-primary text-brand-primary bg-brand-primary/5'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FaBarcode className="w-4 h-4" />
            <span>Takip No & Firma Tespiti</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('carriers')}
            className={`py-3 px-4 font-semibold text-sm rounded-t-xl transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'carriers'
                ? 'border-brand-primary text-brand-primary bg-brand-primary/5'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FaTruck className="w-4 h-4" />
            <span>9 Kargo Firması Rehberi</span>
          </button>
        </div>

        {/* TAB 1: DESI CALCULATOR */}
        {activeTab === 'desi' && (
          <div className="space-y-6">
            <div className="p-6 sm:p-8 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xl backdrop-blur-sm space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label htmlFor="input-width" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    En / Genişlik (cm):
                  </label>
                  <input
                    id="input-width"
                    type="number"
                    min="1"
                    step="0.1"
                    value={width}
                    onChange={(e) => setWidth(e.target.value)}
                    placeholder="Örn: 30"
                    className="w-full px-4 py-2.5 font-mono text-base rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-primary outline-none transition-all"
                  />
                </div>
                <div>
                  <label htmlFor="input-length" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Boy / Uzunluk (cm):
                  </label>
                  <input
                    id="input-length"
                    type="number"
                    min="1"
                    step="0.1"
                    value={length}
                    onChange={(e) => setLength(e.target.value)}
                    placeholder="Örn: 40"
                    className="w-full px-4 py-2.5 font-mono text-base rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-primary outline-none transition-all"
                  />
                </div>
                <div>
                  <label htmlFor="input-height" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Yükseklik (cm):
                  </label>
                  <input
                    id="input-height"
                    type="number"
                    min="1"
                    step="0.1"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    placeholder="Örn: 20"
                    className="w-full px-4 py-2.5 font-mono text-base rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-primary outline-none transition-all"
                  />
                </div>
                <div>
                  <label htmlFor="input-weight" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Gerçek Ağırlık (kg):
                  </label>
                  <input
                    id="input-weight"
                    type="number"
                    min="0"
                    step="0.1"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    placeholder="Örn: 3.5"
                    className="w-full px-4 py-2.5 font-mono text-base rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-primary outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <label htmlFor="input-qty" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Koli / Paket Adedi:
                  </label>
                  <input
                    id="input-qty"
                    type="number"
                    min="1"
                    max="1000"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full px-4 py-2.5 font-mono text-base rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-primary outline-none transition-all"
                  />
                </div>
                <div>
                  <label htmlFor="select-divisor" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Hesaplama Standardı:
                  </label>
                  <select
                    id="select-divisor"
                    value={divisor}
                    onChange={(e) => setDivisor(e.target.value as '3000' | '5000')}
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-primary outline-none transition-all font-semibold"
                  >
                    <option value="3000">Türkiye Yurtiçi Standardı (Bölücü: 3000 - Tüm Kargo Firmaları)</option>
                    <option value="5000">Uluslararası / IATA Standardı (Bölücü: 5000 - DHL, FedEx, UPS)</option>
                  </select>
                </div>
              </div>

              {/* Result Showcase */}
              {desiResult && (
                <div className="mt-6 p-6 rounded-2xl bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-slate-800/60 dark:to-slate-900/60 border border-blue-200 dark:border-blue-900/40 space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                    <div className="p-4 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 shadow-sm">
                      <span className="text-xs uppercase font-bold text-slate-500 dark:text-slate-400 block mb-1">
                        {qNum > 1 ? `Toplam Desi (${qNum} Koli)` : 'Hacimsel Desi'}
                      </span>
                      <span className="text-3xl font-black text-brand-primary">
                        {totalDesi}
                      </span>
                      <span className="text-xs text-slate-500 block mt-1">
                        Tek Koli: {desiResult.desi} Desi (Bölücü: {desiResult.divisorUsed})
                      </span>
                    </div>

                    <div className="p-4 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 shadow-sm">
                      <span className="text-xs uppercase font-bold text-slate-500 dark:text-slate-400 block mb-1">
                        Ücrete Esas Ağırlık
                      </span>
                      <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                        {totalChargeable} {desiResult.pricingBasis === 'desi' ? 'Desi' : 'Kg'}
                      </span>
                      <span className="text-xs text-slate-500 block mt-1">
                        Kargo firmasının fatura edeceği değer
                      </span>
                    </div>

                    <div className="p-4 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 shadow-sm">
                      <span className="text-xs uppercase font-bold text-slate-500 dark:text-slate-400 block mb-1">
                        Koli Boyut Grubu
                      </span>
                      <span className="text-xl font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wide block py-1">
                        {desiResult.sizeCategory}
                      </span>
                      <span className="text-xs text-slate-500 block">
                        Toplam Hacim: {volumeM3} m³ ({volumeLiters} L)
                      </span>
                    </div>
                  </div>

                  {/* Pricing explanation */}
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-100/60 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 text-xs sm:text-sm">
                    <FaInfoCircle className="w-5 h-5 shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
                    <p className="leading-relaxed">
                      <strong>Faturalandırma Kuralı:</strong> Türkiye'deki tüm kargo firmaları (Yurtiçi, Aras, MNG, Sürat, PTT, TEX vb.) 
                      <strong> Hacimsel Desi ({desiResult.desi})</strong> ile <strong>Gerçek Ağırlık ({desiResult.weightKg !== null ? `${desiResult.weightKg} kg` : 'Belirtilmedi'})</strong> kıyaslar 
                      ve hangisi <strong>büyükse</strong> ücreti onun üzerinden faturalandırır. Gönderiniz için faturalandırılacak baz:{' '}
                      <span className="font-bold underline">
                        {desiResult.pricingBasis === 'desi' ? 'Desi (Hacim ağırlıktan yüksek)' : 'Gerçek Ağırlık (Kg desiden yüksek)'}
                      </span>.
                    </p>
                  </div>
                </div>
              )}

              {/* cURL Copy */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
                <span className="text-xs text-slate-500">
                  Bu hesaplamayı API üzerinden e-ticaret sitenize bağlayın: <code className="font-mono text-brand-primary">POST /api/v1/cargo/desi</code>
                </span>
                <button
                  type="button"
                  onClick={handleCopyDesiCurl}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                >
                  {copiedDesiCurl ? <FaCheck className="text-emerald-500" /> : <FaCopy />}
                  <span>{copiedDesiCurl ? 'cURL Kopyalandı' : 'cURL Kopyala'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CARRIER DETECTION */}
        {activeTab === 'detect' && (
          <div className="space-y-6">
            <div className="p-6 sm:p-8 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xl backdrop-blur-sm space-y-6">
              <div>
                <label htmlFor="input-tracking" className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Kargo Takip / Barkod Numarası:
                </label>
                <div className="relative">
                  <input
                    id="input-tracking"
                    type="text"
                    value={trackingInput}
                    onChange={(e) => setTrackingInput(e.target.value)}
                    placeholder="Örn: TEX123456789, HJ9012384712, KP12345678901 veya 12 haneli barkod"
                    className="w-full pl-11 pr-4 py-3.5 text-lg font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-primary outline-none transition-all"
                  />
                  <FaBarcode className="absolute left-4 top-4 text-slate-400 w-5 h-5 pointer-events-none" />
                </div>
              </div>

              {/* Quick sample chips */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">Örnek Numaralar:</span>
                {SAMPLE_TRACKING_CODES.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => setTrackingInput(item.code)}
                    className="px-2.5 py-1 text-xs rounded-lg font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-brand-primary/10 hover:text-brand-primary transition-colors border border-slate-200 dark:border-slate-700"
                  >
                    {item.label}: {item.code}
                  </button>
                ))}
              </div>

              {/* Detection Result Card */}
              {cleanTrackingInput && detectionResult && (
                <div className="mt-4 p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
                  {detectionResult.primaryCarrier ? (
                    <div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              {detectionResult.primaryCarrier.confidence === 'high' ? 'Kesin Eşleşme' : 'Muhtemel Eşleşme'}
                            </span>
                            <span className="text-xs text-slate-500 font-mono">
                              Kod: {detectionResult.trackingNumber}
                            </span>
                          </div>
                          <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                            {detectionResult.primaryCarrier.name}
                          </h2>
                          <p className="text-xs text-slate-500 mt-1">
                            Kısa Ad: {detectionResult.primaryCarrier.shortName}
                          </p>
                        </div>

                        {detectionResult.primaryCarrier.trackingUrl && (
                          <a
                            href={detectionResult.primaryCarrier.trackingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-brand-primary hover:bg-brand-primary-hover text-white font-bold text-sm shadow-md transition-all shrink-0"
                          >
                            <span>Resmi Kargo Takip Sayfasına Git</span>
                            <FaExternalLinkAlt className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>

                      {/* Possible other candidates */}
                      {detectionResult.candidates.length > 1 && (
                        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-2">
                            Aynı formatı kullanan diğer alternatif kargo firmaları:
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {detectionResult.candidates.slice(1).map((c) => (
                              <a
                                key={c.code}
                                href={c.trackingUrl || '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:border-brand-primary transition-colors"
                              >
                                <span>{c.name} ile Sorgula</span>
                                <FaExternalLinkAlt className="w-2.5 h-2.5 text-slate-400" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-slate-500">
                      <FaInfoCircle className="w-8 h-8 mx-auto text-amber-500 mb-2" />
                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                        Tanımlı standart kargo formatıyla tam eşleşmedi.
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Girdiğiniz numara özel müşteri sözleşme kodu veya farklı bir yerel kurye numarası olabilir.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* cURL Copy */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
                <span className="text-xs text-slate-500">
                  Otomatik tespit API'si: <code className="font-mono text-brand-primary">POST /api/v1/cargo/detect</code>
                </span>
                <button
                  type="button"
                  onClick={handleCopyDetectCurl}
                  disabled={!cleanTrackingInput}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-40 transition-colors"
                >
                  {copiedDetectCurl ? <FaCheck className="text-emerald-500" /> : <FaCopy />}
                  <span>{copiedDetectCurl ? 'cURL Kopyalandı' : 'cURL Kopyala'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: 9 CARRIERS GUIDE */}
        {activeTab === 'carriers' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.values(TURKISH_CARRIERS).map((carrier) => (
              <div
                key={carrier.code}
                className="p-5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {carrier.shortName}
                    </span>
                    <a
                      href={carrier.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-brand-primary hover:underline inline-flex items-center gap-1"
                    >
                      <span>Web Sitesi</span>
                      <FaExternalLinkAlt className="w-2.5 h-2.5" />
                    </a>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {carrier.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Barkod Deseni: {carrier.patterns.description}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-mono">
                    Tel: {carrier.phone}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] text-slate-400 block font-mono truncate">
                    API Code: <strong>{carrier.code}</strong>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Informational SEO Content Box */}
        <div className="p-6 sm:p-8 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Türkiye'de Kargo Desi Hesaplama Nasıl Yapılır?
          </h2>
          <div className="prose prose-sm dark:prose-invert max-w-none text-slate-600 dark:text-slate-400 space-y-3 leading-relaxed">
            <p>
              Desi, kargo taşımacılığında gönderinin hacimsel ağırlığını belirleyen ölçü birimidir. Türkiye standartlarında 
              yurtiçi gönderilerde <strong>(En × Boy × Yükseklik) / 3000</strong> formülü uygulanır. Örnek olarak 30 cm en, 40 cm boy ve 
              20 cm yüksekliğindeki bir koli: <code className="text-brand-primary">(30 × 40 × 20) / 3000 = 8 Desi</code> yapar.
            </p>
            <p>
              Kargo şirketleri, paketi taşırken aracın hacim kapasitesini dolduran hafif ama büyük paketler için haksız fiyatlandırmayı önlemek amacıyla 
              her zaman <strong>Gerçek Ağırlık (kg)</strong> ile <strong>Desi</strong> arasından büyük olanı faturalandırır.
            </p>
            <h3 className="text-base font-bold text-slate-900 dark:text-white pt-2">
              E-Ticaret ve ERP Sistemleri İçin REST API Entegrasyonu
            </h3>
            <p>
              Noktanyus Kargo API modülü ile Shopify, WooCommerce, Ticimax, IdeaSoft veya özel ERP altyapınızda tek satır kod ile kargo takip 
              numaralarının hangi firmaya ait olduğunu otomatik algılayabilir, sepet sayfasında anında desi ve kargo maliyeti hesaplayabilirsiniz.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
