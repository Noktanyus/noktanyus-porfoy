'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  FaCalculator,
  FaCopy,
  FaCheck,
  FaArrowLeft,
  FaInfoCircle,
  FaReceipt,
  FaFileInvoiceDollar,
  FaBalanceScale,
} from 'react-icons/fa';
import { calculateSmm, type SmmWithholdingFraction } from '@/modules/tr-api/smm';
import { TrackRecentTool } from '@/components/tools/TrackRecentTool';

export default function SmmToolClient() {
  const [amountStr, setAmountStr] = useState<string>('10000');
  const [mode, setMode] = useState<'gross' | 'net'>('gross');
  const [stopajRate, setStopajRate] = useState<number>(20);
  const [vatRate, setVatRate] = useState<number>(20);
  const [withholding, setWithholding] = useState<SmmWithholdingFraction>('none');
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

  const amount = parseFloat(amountStr) || 0;

  const result =
    amount > 0
      ? calculateSmm({
          amount,
          mode,
          stopajRate,
          vatRate,
          withholding,
        })
      : null;

  const handleCopyCurl = () => {
    const curl = `curl -X POST "https://noktanyus.com/api/v1/finance/smm" \\\n  -H "x-api-key: YOUR_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{"amount":${amount},"mode":"${mode}","stopajRate":${stopajRate},"vatRate":${vatRate},"withholding":"${withholding}"}'`;
    navigator.clipboard.writeText(curl);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  const handleCopySummary = () => {
    if (!result) return;
    const text = `--- SERBEST MESLEK MAKBUZU HESAP DÖKÜMÜ ---
Brüt Ücret: ₺${result.grossAmount.toFixed(2)}
GV Stopajı (%${result.stopajRate}): -₺${result.stopajAmount.toFixed(2)}
Net Ücret: ₺${result.netFee.toFixed(2)}
Hesaplanan KDV (%${result.vatRate}): +₺${result.vatAmount.toFixed(2)}
${result.withholdingFraction !== 'none' ? `Tevkif Edilen KDV (${result.withholdingFraction}): -₺${result.withheldVatAmount.toFixed(2)}\nTahsil Edilen KDV: +₺${result.collectedVatAmount.toFixed(2)}\n` : ''}------------------------------------------
ELE GEÇEN NET TUTAR: ₺${result.netReceived.toFixed(2)}
MÜŞTERİ TOPLAM MALİYETİ: ₺${result.clientTotalCost.toFixed(2)}
DEVLETE ÖDENECEK VERGİ: ₺${result.totalTaxToState.toFixed(2)} (Stopaj: ₺${result.stopajAmount.toFixed(2)}${result.withheldVatAmount > 0 ? ` + KDV-2: ₺${result.withheldVatAmount.toFixed(2)}` : ''})
Hesaplama: Noktanyus SMM Motoru (noktanyus.com/araclar/smm-hesaplama)`;

    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  return (
    <div className="section-glass-hero bg-blob-decoration py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      <TrackRecentTool slug="smm-hesaplama" title="SMM Hesaplama" />

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
            <FaReceipt className="w-3 h-3" />
            <span>GVK m.94 & KDVK Mevzuatına Uygun Kuruş Hassasiyetli Motor</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white">
            Serbest Meslek Makbuzu (SMM) Hesaplama Aracı
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
            Yazılımcılar, avukatlar, mali müşavirler ve danışmanlar için brütten nete veya netten brüte stopaj, 
            KDV ve tevkifat dahil anında SMM dökümü ve müşteri maliyeti hesaplayın.
          </p>
        </header>

        {/* Calculator Form */}
        <div className="p-6 sm:p-8 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xl backdrop-blur-sm space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* Amount & Mode */}
            <div className="md:col-span-6 space-y-2">
              <label htmlFor="smm-amount" className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                {mode === 'gross' ? 'Brüt Tutar (TL):' : 'Ele Geçecek Net Tutar (TL):'}
              </label>
              <input
                id="smm-amount"
                type="number"
                min="0"
                step="any"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                placeholder="Örn: 10000"
                className="w-full px-4 py-3 font-mono text-xl rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-primary outline-none transition-all"
              />
            </div>

            <div className="md:col-span-6 space-y-2">
              <span className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Hesaplama Yönü:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMode('gross')}
                  className={`py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all border ${
                    mode === 'gross'
                      ? 'bg-brand-primary text-white border-brand-primary shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Brütten Nete
                </button>
                <button
                  type="button"
                  onClick={() => setMode('net')}
                  className={`py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all border ${
                    mode === 'net'
                      ? 'bg-brand-primary text-white border-brand-primary shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Netten Brüte
                </button>
              </div>
            </div>

            {/* Rates Grid */}
            <div className="md:col-span-4 space-y-1.5">
              <label htmlFor="smm-stopaj" className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Gelir Vergisi Stopajı:
              </label>
              <select
                id="smm-stopaj"
                value={stopajRate}
                onChange={(e) => setStopajRate(Number(e.target.value))}
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-primary outline-none transition-all font-semibold"
              >
                <option value={20}>%20 (Standart Serbest Meslek)</option>
                <option value={17}>%17</option>
                <option value={15}>%15</option>
                <option value={10}>%10</option>
                <option value={0}>%0 (Stopajsız)</option>
              </select>
            </div>

            <div className="md:col-span-4 space-y-1.5">
              <label htmlFor="smm-vat" className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                KDV Oranı:
              </label>
              <select
                id="smm-vat"
                value={vatRate}
                onChange={(e) => setVatRate(Number(e.target.value))}
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-primary outline-none transition-all font-semibold"
              >
                <option value={20}>%20 (Genel Hizmet & Yazılım)</option>
                <option value={10}>%10</option>
                <option value={1}>%1</option>
                <option value={0}>%0 (KDV İstisnası)</option>
              </select>
            </div>

            <div className="md:col-span-4 space-y-1.5">
              <label htmlFor="smm-withholding" className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                KDV Tevkifatı:
              </label>
              <select
                id="smm-withholding"
                value={withholding}
                onChange={(e) => setWithholding(e.target.value as SmmWithholdingFraction)}
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-primary outline-none transition-all font-semibold"
              >
                <option value="none">Tevkifat Yok</option>
                <option value="5/10">5/10 (Danışmanlık / Mühendislik)</option>
                <option value="9/10">9/10 (Hukuki Hizmet / Avukatlık)</option>
                <option value="2/10">2/10</option>
                <option value="3/10">3/10</option>
                <option value="7/10">7/10</option>
                <option value="10/10">10/10 (Tam Tevkifat)</option>
              </select>
            </div>
          </div>

          {/* Results Display */}
          {result && (
            <div className="space-y-6 pt-4 border-t border-slate-100 dark:border-slate-800">
              {/* Highlight Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 text-center">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block mb-1">
                    Ele Geçecek Net Tutar
                  </span>
                  <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                    ₺{result.netReceived.toFixed(2)}
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-1">
                    Net Ücret + Tahsil Edilen KDV
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/20 text-center">
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block mb-1">
                    Müşteri Toplam Maliyeti
                  </span>
                  <span className="text-3xl font-black text-blue-600 dark:text-blue-400">
                    ₺{result.clientTotalCost.toFixed(2)}
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-1">
                    Brüt Tutar + Toplam KDV
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-gradient-to-br from-rose-500/10 to-amber-500/10 border border-rose-500/20 text-center">
                  <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider block mb-1">
                    Devlete Ödenecek Vergi
                  </span>
                  <span className="text-3xl font-black text-rose-600 dark:text-rose-400">
                    ₺{result.totalTaxToState.toFixed(2)}
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-1">
                    Muhtasar Stopaj {result.withheldVatAmount > 0 ? '+ KDV-2' : ''}
                  </span>
                </div>
              </div>

              {/* Detailed Invoice Breakdown Table */}
              <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm">
                <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <FaFileInvoiceDollar className="text-brand-primary" />
                    <span>Resmi Makbuz Dökümü (GİB E-SMM Formatı)</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleCopySummary}
                    className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:border-brand-primary transition-colors"
                  >
                    {copiedSummary ? <FaCheck className="text-emerald-500" /> : <FaCopy />}
                    <span>{copiedSummary ? 'Döküm Kopyalandı' : 'Metin Olarak Kopyala'}</span>
                  </button>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-sm">
                  <div className="px-5 py-3 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20 font-bold">
                    <span className="text-slate-800 dark:text-slate-200">Brüt Hizmet Tutarı</span>
                    <span className="text-slate-900 dark:text-white">₺{result.grossAmount.toFixed(2)}</span>
                  </div>

                  <div className="px-5 py-3 flex justify-between items-center text-rose-600 dark:text-rose-400">
                    <span>(-) GV Stopaj Kesintisi (%{result.stopajRate})</span>
                    <span>-₺{result.stopajAmount.toFixed(2)}</span>
                  </div>

                  <div className="px-5 py-3 flex justify-between items-center font-bold text-slate-700 dark:text-slate-300">
                    <span>(=) Net Hizmet Ücreti</span>
                    <span>₺{result.netFee.toFixed(2)}</span>
                  </div>

                  <div className="px-5 py-3 flex justify-between items-center text-blue-600 dark:text-blue-400">
                    <span>(+) Hesaplanan KDV (%{result.vatRate})</span>
                    <span>+₺{result.vatAmount.toFixed(2)}</span>
                  </div>

                  {result.withholdingFraction !== 'none' && (
                    <>
                      <div className="px-5 py-3 flex justify-between items-center text-amber-600 dark:text-amber-400 pl-8">
                        <span>(-) KDV Tevkifatı ({result.withholdingFraction})</span>
                        <span>-₺{result.withheldVatAmount.toFixed(2)}</span>
                      </div>
                      <div className="px-5 py-3 flex justify-between items-center text-slate-600 dark:text-slate-400 pl-8">
                        <span>(=) Tahsil Edilen KDV</span>
                        <span>+₺{result.collectedVatAmount.toFixed(2)}</span>
                      </div>
                    </>
                  )}

                  <div className="px-5 py-4 flex justify-between items-center bg-emerald-500/10 font-bold text-emerald-700 dark:text-emerald-300 text-base">
                    <span>(=) TAHSİL EDİLECEK NET TUTAR</span>
                    <span className="text-lg">₺{result.netReceived.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Informative Tax Note */}
              <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 text-xs sm:text-sm">
                <FaInfoCircle className="w-5 h-5 shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
                <p className="leading-relaxed">
                  <strong>Vergi Beyanı Özeti:</strong> Müşteriniz sizin adınıza muhtasar beyanname ile devlete 
                  <strong> ₺{result.stopajAmount.toFixed(2)}</strong> stopaj ödeyecektir.
                  {result.withheldVatAmount > 0 && (
                    <> Ayrıca 2 No'lu KDV beyannamesi ile devlete <strong>₺{result.withheldVatAmount.toFixed(2)}</strong> tevkifat ödeyecektir.</>
                  )}
                  {' '}Sizin 1 No'lu KDV beyannamesinde devlete bildireceğiniz teslim KDV tutarı ise <strong>₺{result.collectedVatAmount.toFixed(2)}</strong> olacaktır.
                </p>
              </div>
            </div>
          )}

          {/* cURL Banner */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              REST API Entegrasyonu: <code className="font-mono text-brand-primary">POST /api/v1/finance/smm</code>
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

        {/* Informational SEO Content Box */}
        <div className="p-6 sm:p-8 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Serbest Meslek Makbuzu (SMM) Nasıl Hesaplanır?
          </h2>
          <div className="prose prose-sm dark:prose-invert max-w-none text-slate-600 dark:text-slate-400 space-y-3 leading-relaxed">
            <p>
              Serbest meslek erbabı (yazılımcı, mimar, avukat, mali müşavir, doktor, danışman) fatura yerine 
              <strong> Serbest Meslek Makbuzu (e-SMM)</strong> düzenler. Makbuzda iki ana vergi unsuru yer alır:
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Gelir Vergisi Stopajı (%20):</strong> Hizmeti alan firma tarafından kesilerek serbest meslek erbabı adına muhtasar beyanname ile devlete ödenir.</li>
              <li><strong>KDV (%20):</strong> Brüt tutar üzerinden hesaplanır. Tevkifat yoksa tamamı serbest meslek erbabı tarafından tahsil edilir.</li>
              <li><strong>KDV Tevkifatı (örn: 5/10 veya 9/10):</strong> KDV'nin bir kısmının müşteri tarafından kesilip KDV-2 beyannamesiyle doğrudan vergi dairesine ödenmesidir.</li>
            </ul>
            <h3 className="text-base font-bold text-slate-900 dark:text-white pt-2">
              Netten Brüte Hesaplama Formülü
            </h3>
            <p>
              Elinize geçmesini istediğiniz net tutar üzerinden brüt tutara ulaşmak için formül: 
              <code className="text-brand-primary"> Brüt = Net / [(1 - Stopaj) + KDV × (1 - Tevkifat)]</code> şeklindedir.
              Standart tevkifatsız durumda %20 stopaj ve %20 KDV birbirini dengelediği için Brüt Tutar, Net Tahsil Edilen Tutara eşittir.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
