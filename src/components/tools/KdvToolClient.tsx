'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FaCalculator, FaCopy, FaCheck, FaCode, FaArrowLeft } from 'react-icons/fa';
import { calculateKdvWithholding, type WithholdingFraction } from '@/modules/tr-api';

export default function KdvToolClient() {
  const [amountStr, setAmountStr] = useState('1000');
  const [vatRate, setVatRate] = useState<0 | 1 | 10 | 20>(20);
  const [mode, setMode] = useState<'net' | 'gross'>('net');
  const [withholding, setWithholding] = useState<WithholdingFraction | 'none'>('5/10');
  const [copied, setCopied] = useState(false);

  const amountNum = parseFloat(amountStr) || 0;
  const amountCents = Math.round(amountNum * 100);

  const result =
    amountCents > 0
      ? calculateKdvWithholding({
          amountCents,
          vatRate,
          mode,
          withholding: withholding === 'none' ? undefined : withholding,
        })
      : null;

  const handleCopyCurl = () => {
    const curl = `curl -X POST "https://noktanyus.com/api/v1/finance/tevkifat" \\\n  -H "x-api-key: YOUR_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{"amountCents":${amountCents},"vatRate":${vatRate},"mode":"${mode}"${withholding !== 'none' ? `,"withholding":"${withholding}"` : ''}}'`;
    navigator.clipboard.writeText(curl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="section-glass-hero bg-blob-decoration py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <div className="relative z-10 space-y-8">
        <div>
          <Link
            href="/araclar"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-brand-primary transition-colors"
          >
            <FaArrowLeft className="w-3.5 h-3.5" />
            <span>Tüm Araçlara Dön</span>
          </Link>
        </div>

        <header className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <FaCalculator className="w-3 h-3" />
            <span>GİB Mevzuatına Uygun Kuruş Hassasiyetli Hesap</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white">
            KDV ve Tevkifat Hesaplama Aracı
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
            Net veya brüt tutar üzerinden KDV'yi ve 2/10, 5/10, 7/10 gibi resmi tevkifat oranlarını anında hesaplayın.
          </p>
        </header>

        {/* Calculator Form */}
        <div className="p-6 sm:p-8 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xl backdrop-blur-sm space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Amount */}
            <div className="sm:col-span-3">
              <label htmlFor="amount-input" className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                Tutar (TL):
              </label>
              <input
                id="amount-input"
                type="number"
                min="0"
                step="any"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                placeholder="Örn: 1000"
                className="w-full px-4 py-3 text-lg font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-primary outline-none transition-all"
              />
            </div>

            {/* Mode */}
            <div>
              <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Hesaplama Yönü:</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMode('net')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-colors ${
                    mode === 'net'
                      ? 'bg-brand-primary text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Netten Brüte
                </button>
                <button
                  type="button"
                  onClick={() => setMode('gross')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-colors ${
                    mode === 'gross'
                      ? 'bg-brand-primary text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Brütten Nete
                </button>
              </div>
            </div>

            {/* Vat Rate */}
            <div>
              <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">KDV Oranı:</span>
              <div className="grid grid-cols-3 gap-1.5">
                {([1, 10, 20] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setVatRate(r)}
                    className={`py-2 rounded-lg text-xs font-bold transition-colors ${
                      vatRate === r
                        ? 'bg-brand-primary text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    %{r}
                  </button>
                ))}
              </div>
            </div>

            {/* Withholding */}
            <div>
              <label htmlFor="withholding-select" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Tevkifat Oranı:</label>
              <select
                id="withholding-select"
                value={withholding}
                onChange={(e) => setWithholding(e.target.value as WithholdingFraction | 'none')}
                className="w-full py-2 px-3 rounded-lg text-xs font-bold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
              >
                <option value="none">Tevkifatsız (Tam KDV)</option>
                <option value="2/10">2/10 Tevkifat</option>
                <option value="3/10">3/10 Tevkifat</option>
                <option value="4/10">4/10 Tevkifat</option>
                <option value="5/10">5/10 Tevkifat</option>
                <option value="7/10">7/10 Tevkifat</option>
                <option value="9/10">9/10 Tevkifat</option>
                <option value="10/10">10/10 (Tam Tevkifat)</option>
              </select>
            </div>
          </div>

          {/* Results Table */}
          {result && (
            <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Hesaplama Dökümü
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                  <span className="block text-xs text-slate-500">Matrah (Net Tutar):</span>
                  <span className="text-base font-mono font-bold text-slate-900 dark:text-white">
                    {(result.netCents / 100).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                  <span className="block text-xs text-slate-500">Hesaplanan KDV (%{vatRate}):</span>
                  <span className="text-base font-mono font-bold text-blue-600 dark:text-blue-400">
                    {(result.vatCents / 100).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                  <span className="block text-xs text-slate-500">Toplam Fatura Tutarı:</span>
                  <span className="text-base font-mono font-bold text-slate-900 dark:text-white">
                    {((result.netCents + result.vatCents) / 100).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                  </span>
                </div>
                {result.withholdingCents > 0 && (
                  <>
                    <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                      <span className="block text-xs text-amber-700 dark:text-amber-300">Tevkif Edilen KDV ({withholding}):</span>
                      <span className="text-base font-mono font-bold text-amber-600 dark:text-amber-400">
                        {(result.withholdingCents / 100).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                      </span>
                    </div>
                    <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/30">
                      <span className="block text-xs text-indigo-700 dark:text-indigo-300">Satıcıya Ödenecek:</span>
                      <span className="text-base font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {(result.payableToSellerCents / 100).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                      </span>
                    </div>
                    <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30">
                      <span className="block text-xs text-rose-700 dark:text-rose-300">Alıcının Beyan Edeceği (KDV-2):</span>
                      <span className="text-base font-mono font-bold text-rose-600 dark:text-rose-400">
                        {(result.remittedByBuyerCents / 100).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* API CTA */}
        <div className="p-6 sm:p-8 rounded-2xl bg-slate-900 text-white border border-slate-800 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <FaCode className="w-5 h-5 text-brand-primary" />
              <h3 className="text-lg font-bold">ERP / Fatura Yazılımınıza API Olarak Bağlayın</h3>
            </div>
            <button
              type="button"
              onClick={handleCopyCurl}
              className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors self-start sm:self-auto"
            >
              {copied ? <FaCheck className="w-3.5 h-3.5 text-emerald-400" /> : <FaCopy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Kopyalandı!' : 'cURL Kopyala'}</span>
            </button>
          </div>

          <pre className="p-4 rounded-xl bg-slate-950 font-mono text-xs sm:text-sm text-slate-300 overflow-x-auto border border-slate-800/80">
{`curl -X POST "https://noktanyus.com/api/v1/finance/tevkifat" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"amountCents":${amountCents},"vatRate":${vatRate},"mode":"${mode}"${withholding !== 'none' ? `,"withholding":"${withholding}"` : ''}}'`}
          </pre>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            <span className="text-xs text-slate-400">Kuruş kayıpları yaşamadan tam mevzuat uyumu sağlayın.</span>
            <div className="flex items-center gap-3">
              <Link
                href="/docs#tag/TR-API/operation/api-v1-finance-tevkifat-post"
                className="text-xs font-bold text-brand-primary hover:underline"
              >
                API Dokümantasyonu →
              </Link>
              <Link
                href="/kayit"
                className="px-4 py-2 rounded-lg bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-bold transition-colors"
              >
                Ücretsiz API Key Al
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
