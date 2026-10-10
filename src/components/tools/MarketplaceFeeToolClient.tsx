'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  FaCalculator,
  FaCopy,
  FaCheck,
  FaArrowLeft,
  FaShoppingBag,
  FaTruck,
  FaPercentage,
  FaBoxOpen,
  FaExternalLinkAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaCoins,
} from 'react-icons/fa';
import {
  calculateMarketplaceFee,
  estimatePlatformCargoCost,
  MARKETPLACE_CATEGORIES,
  PLATFORMS,
  type MarketplacePlatform,
} from '@/modules/tr-api/marketplaceFee';
import { TrackRecentTool } from '@/components/tools/TrackRecentTool';

export default function MarketplaceFeeToolClient() {
  const [platform, setPlatform] = useState<MarketplacePlatform>('trendyol');
  const [salePriceStr, setSalePriceStr] = useState('450');
  const [purchasePriceStr, setPurchasePriceStr] = useState('180');
  const [selectedCategory, setSelectedCategory] = useState<string>('giyim_moda');
  const [customCommission, setCustomCommission] = useState<string>('');
  const [cargoDesiStr, setCargoDesiStr] = useState('2');
  const [customCargoCost, setCustomCargoCost] = useState('');
  const [packagingCostStr, setPackagingCostStr] = useState('10');
  const [applyWithholding, setApplyWithholding] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);

  const salePrice = parseFloat(salePriceStr) || 0;
  const purchasePrice = parseFloat(purchasePriceStr) || 0;
  const cargoDesi = parseFloat(cargoDesiStr) || 0;
  const packagingCost = parseFloat(packagingCostStr) || 0;
  const customComm = customCommission ? parseFloat(customCommission) : undefined;
  const customCargo = customCargoCost ? parseFloat(customCargoCost) : undefined;

  const result = calculateMarketplaceFee({
    platform,
    salePrice,
    purchasePrice,
    categoryId: customComm === undefined ? selectedCategory : undefined,
    customCommissionRate: customComm,
    cargoDesi: customCargo === undefined ? cargoDesi : undefined,
    cargoCost: customCargo,
    packagingCost,
    applyWithholding,
  });

  const handleCopySummary = () => {
    if (!result) return;
    const text = `--- ${result.platformName.toUpperCase()} KÂR & KOMİSYON DÖKÜMÜ ---
Müşteri Satış Fiyatı: ₺${result.salePrice.toFixed(2)}
Ürün Alış Maliyeti: ₺${result.purchasePrice.toFixed(2)}
Platform Komisyonu: ₺${result.commissionAmount.toFixed(2)} (%${result.commissionRate})
Komisyon KDV'si (%20): ₺${result.commissionVat.toFixed(2)}
Toplam Komisyon Maliyeti: ₺${result.totalCommissionWithVat.toFixed(2)}
Platform Hizmet Bedeli: ₺${result.serviceFee.toFixed(2)}
Kargo Maliyeti: ₺${result.cargoCost.toFixed(2)}
Paketleme / Ambalaj: ₺${result.packagingCost.toFixed(2)}
${result.withholdingAmount > 0 ? `E-Ticaret Stopajı (%1): ₺${result.withholdingAmount.toFixed(2)}\n` : ''}------------------------------------------
PLATFORMDAN GELECEK HAK EDİŞ: ₺${result.netPayoutFromPlatform.toFixed(2)}
NET CEBE KALAN KÂR: ₺${result.netProfit.toFixed(2)}
KÂR MARJI: %${result.profitMarginPercent.toFixed(2)}
ROI (Yatırım Getirisi): %${result.roiPercent.toFixed(2)}
Hesaplama: Noktanyus E-Ticaret Araçları (noktanyus.com/araclar/pazaryeri-komisyon-hesaplama)`;

    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  const handleCopyCurl = () => {
    const curl = `curl -X POST "https://noktanyus.com/api/v1/commerce/marketplace-fee" \\\n  -H "x-api-key: YOUR_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{"platform":"${platform}","salePrice":${salePrice},"purchasePrice":${purchasePrice},"categoryId":"${selectedCategory}","cargoDesi":${cargoDesi},"packagingCost":${packagingCost}}'`;
    navigator.clipboard.writeText(curl);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  return (
    <div className="section-glass-hero bg-blob-decoration py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      <TrackRecentTool slug="pazaryeri-komisyon-hesaplama" title="Pazaryeri Komisyon" />

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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <FaShoppingBag className="w-3 h-3" />
            <span>Trendyol • Hepsiburada • Amazon TR • N11 Güncel Barem & Komisyonları</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white">
            Pazaryeri Komisyon & Net Kâr Hesaplama
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
            E-ticaret pazaryerlerinde ürün satarken kategori komisyonu, kargo baremi, KDV, stopaj ve ambalaj giderlerini
            düşerek gerçek net kârınızı ve kâr marjınızı anında hesaplayın.
          </p>
        </header>

        {/* Platform Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(['trendyol', 'hepsiburada', 'amazon_tr', 'n11'] as MarketplacePlatform[]).map((pKey) => {
            const pInfo = PLATFORMS[pKey];
            const isSelected = platform === pKey;
            return (
              <button
                key={pKey}
                onClick={() => setPlatform(pKey)}
                className={`py-3.5 px-4 rounded-2xl border font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-sm ${
                  isSelected
                    ? 'border-brand-primary bg-brand-primary text-white shadow-brand-primary/25 shadow-md'
                    : 'border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 hover:border-brand-primary/50'
                }`}
              >
                <span>{pInfo.name}</span>
              </button>
            );
          })}
        </div>

        {/* Calculator Inputs & Result Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Inputs Column */}
          <div className="lg:col-span-7 p-6 sm:p-7 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xl backdrop-blur-sm space-y-5">
            <h2 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
              <FaCalculator className="text-brand-primary w-4 h-4" />
              <span>Ürün ve Maliyet Bilgileri</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Müşteri Satış Fiyatı (TL)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₺</span>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={salePriceStr}
                    onChange={(e) => setSalePriceStr(e.target.value)}
                    className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-bold text-sm sm:text-base focus:ring-2 focus:ring-brand-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Ürün Alış / Maliyet (TL)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₺</span>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={purchasePriceStr}
                    onChange={(e) => setPurchasePriceStr(e.target.value)}
                    className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-bold text-sm sm:text-base focus:ring-2 focus:ring-brand-primary"
                  />
                </div>
              </div>
            </div>

            {/* Category or Custom Commission */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Ürün Kategorisi & Komisyon Oranı
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-8">
                  <select
                    disabled={Boolean(customCommission)}
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full py-2.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-brand-primary disabled:opacity-50"
                  >
                    {MARKETPLACE_CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name} (%{cat.commissionRates[platform]})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-4">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    placeholder="Özel % (İsteğe bağlı)"
                    value={customCommission}
                    onChange={(e) => setCustomCommission(e.target.value)}
                    className="w-full py-2.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-brand-primary"
                  />
                </div>
              </div>
            </div>

            {/* Cargo Desi & Packaging */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Kargo Desisi
                  </label>
                  <Link
                    href="/araclar/kargo-desi-hesaplama"
                    target="_blank"
                    className="text-[11px] text-brand-primary hover:underline flex items-center gap-1 font-semibold"
                  >
                    <span>Desi Hesapla</span>
                    <FaExternalLinkAlt className="w-2.5 h-2.5" />
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={cargoDesiStr}
                    onChange={(e) => {
                      setCargoDesiStr(e.target.value);
                      setCustomCargoCost('');
                    }}
                    className="w-full py-2.5 px-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-brand-primary"
                  >
                    <option value="1">1 Desi (~₺42.5)</option>
                    <option value="2">2 Desi (~₺49.0)</option>
                    <option value="3">3 Desi (~₺62.0)</option>
                    <option value="5">5 Desi (~₺62.0)</option>
                    <option value="10">10 Desi (~₺85.0)</option>
                    <option value="15">15 Desi (~₺115.0)</option>
                  </select>
                  <input
                    type="number"
                    min="0"
                    placeholder="Manuel ₺"
                    value={customCargoCost}
                    onChange={(e) => setCustomCargoCost(e.target.value)}
                    className="w-full py-2.5 px-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-brand-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Paketleme / Kutu Maliyeti (TL)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₺</span>
                  <input
                    type="number"
                    min="0"
                    value={packagingCostStr}
                    onChange={(e) => setPackagingCostStr(e.target.value)}
                    className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-brand-primary"
                  />
                </div>
              </div>
            </div>

            {/* Withholding Checkbox */}
            <div className="pt-2">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={applyWithholding}
                  onChange={(e) => setApplyWithholding(e.target.checked)}
                  className="w-4 h-4 rounded text-brand-primary border-slate-300 focus:ring-brand-primary"
                />
                <span className="text-xs text-slate-600 dark:text-slate-400">
                  %1 E-Ticaret Tevkifat Stopajı uygulansın (GVK m.94 kapsamında platformun kestiği vergi)
                </span>
              </label>
            </div>
          </div>

          {/* Results Column */}
          <div className="lg:col-span-5 space-y-4">
            {/* Net Profit Card */}
            <div
              className={`p-6 sm:p-7 rounded-2xl border shadow-xl backdrop-blur-sm space-y-4 ${
                result.isProfitable
                  ? 'bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent border-emerald-500/30'
                  : 'bg-gradient-to-br from-rose-500/10 via-red-500/5 to-transparent border-rose-500/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Net Cebe Kalan Kâr
                </span>
                <span
                  className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full ${
                    result.isProfitable
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                      : 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300'
                  }`}
                >
                  {result.isProfitable ? <FaCheckCircle className="w-3 h-3" /> : <FaTimesCircle className="w-3 h-3" />}
                  <span>{result.isProfitable ? 'KÂRLI SATIŞ' : 'ZARAR'}</span>
                </span>
              </div>

              <div>
                <div
                  className={`text-3xl sm:text-4xl font-extrabold ${
                    result.isProfitable ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  ₺{result.netProfit.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-3">
                  <span>
                    Kâr Marjı: <strong>%{result.profitMarginPercent.toFixed(1)}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    ROI: <strong>%{result.roiPercent.toFixed(1)}</strong>
                  </span>
                </div>
              </div>

              {/* Payout & Deductions */}
              <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800/60 space-y-2 text-xs">
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                  <span>Pazaryeri Hak Ediş Ödemesi:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    ₺{result.netPayoutFromPlatform.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                  <span>Toplam Maliyet & Kesintiler:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    ₺{result.totalCostWithPurchase.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Cost Breakdown Table */}
            <div className="p-5 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 text-xs space-y-2.5">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-2">
                Kesinti ve Masraf Detayları
              </h3>

              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Platform Komisyonu (%{result.commissionRate}):</span>
                <span>₺{result.commissionAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Komisyon KDV&apos;si (%20):</span>
                <span>₺{result.commissionVat.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Platform Hizmet Bedeli:</span>
                <span>₺{result.serviceFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Kargo Maliyeti:</span>
                <span>₺{result.cargoCost.toFixed(2)}</span>
              </div>
              {result.packagingCost > 0 && (
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Paketleme / Kutu:</span>
                  <span>₺{result.packagingCost.toFixed(2)}</span>
                </div>
              )}
              {result.withholdingAmount > 0 && (
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Stopaj Tevkifatı (%1):</span>
                  <span>₺{result.withholdingAmount.toFixed(2)}</span>
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex gap-2">
                <button
                  onClick={handleCopySummary}
                  className="flex-1 py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-brand-primary hover:text-white font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  {copiedSummary ? <FaCheck className="w-3 h-3" /> : <FaCopy className="w-3 h-3" />}
                  <span>{copiedSummary ? 'Döküm Kopyalandı' : 'Özeti Kopyala'}</span>
                </button>
                <button
                  onClick={handleCopyCurl}
                  className="py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-semibold transition-colors"
                  title="cURL İsteğini Kopyala"
                >
                  {copiedCurl ? <FaCheck className="w-3 h-3 text-emerald-500" /> : <FaCoins className="w-3 h-3" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* API Integration CTA */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-950 via-slate-900 to-rose-950 border border-amber-500/30 text-white flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="space-y-1 text-center md:text-left">
            <h4 className="font-bold text-lg">E-Ticaret Yazılımınıza Entegre Edin</h4>
            <p className="text-slate-300 text-xs sm:text-sm max-w-xl">
              <code className="text-amber-300 font-mono">POST /api/v1/commerce/marketplace-fee</code> ile toplu ürün
              fiyatlandırma ve kârlılık analizini kendi ERP veya satıcı panelinize bağlayın.
            </p>
          </div>
          <Link
            href="/docs"
            className="px-5 py-2.5 rounded-xl bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs sm:text-sm shrink-0 transition-colors shadow"
          >
            API Dokümantasyonu
          </Link>
        </div>
      </div>
    </div>
  );
}
