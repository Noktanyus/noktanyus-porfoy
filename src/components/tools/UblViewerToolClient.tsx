'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  FaFileCode,
  FaCheckCircle,
  FaExclamationTriangle,
  FaTimesCircle,
  FaArrowLeft,
  FaFileUpload,
  FaTrashAlt,
  FaCode,
  FaCheck,
  FaBuilding,
  FaReceipt,
  FaCoins,
} from 'react-icons/fa';
import {
  validateUblXml,
  parseUblInvoiceSummary,
  SAMPLE_UBL_XML,
} from '@/modules/tr-api/ubl';
import { TrackRecentTool } from '@/components/tools/TrackRecentTool';

export default function UblViewerToolClient() {
  const [xmlInput, setXmlInput] = useState<string>(SAMPLE_UBL_XML);
  const [copiedCurl, setCopiedCurl] = useState(false);

  const validationResult = useMemo(() => {
    if (!xmlInput.trim()) return null;
    return validateUblXml({ xml: xmlInput });
  }, [xmlInput]);

  const invoiceSummary = useMemo(() => {
    if (!xmlInput.trim()) return null;
    return parseUblInvoiceSummary(xmlInput);
  }, [xmlInput]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) setXmlInput(content);
    };
    reader.readAsText(file);
  };

  const handleCopyCurl = () => {
    const curl = `curl -X POST "https://noktanyus.com/api/v1/invoice/ubl-validate" \\\n  -H "x-api-key: YOUR_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{"xml":"${xmlInput.slice(0, 100).replace(/\n/g, '')}..."}'`;
    navigator.clipboard.writeText(curl);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  return (
    <div className="section-glass-hero bg-blob-decoration py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      <TrackRecentTool slug="ubl-fatura-goruntuleyici" title="UBL Fatura Görüntüleyici" />

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
            <FaFileCode className="w-3 h-3" />
            <span>GİB UBL-TR 2.1 e-Fatura & e-Arşiv Standartları</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white">
            UBL e-Fatura XML Görüntüleyici & Doğrulayıcı
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
            e-Fatura ve e-Arşiv XML dosyalarınızı tarayıcınızda güvenle görüntüleyin, zorunlu alanları ve şematik
            hataları anında denetleyin. Fatura taraflarını ve tutarlarını kurumsal kart formatında inceleyin.
          </p>
        </header>

        {/* Actions Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <label className="cursor-pointer px-3.5 py-2 rounded-xl bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-bold inline-flex items-center gap-2 shadow-sm transition-colors">
              <FaFileUpload className="w-3.5 h-3.5" />
              <span>XML Dosyası Yükle</span>
              <input
                type="file"
                accept=".xml,text/xml"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            <button
              onClick={() => setXmlInput(SAMPLE_UBL_XML)}
              className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors"
            >
              Örnek Faturayı Yükle
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setXmlInput('')}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors text-xs font-semibold inline-flex items-center gap-1.5"
              title="Metni Temizle"
            >
              <FaTrashAlt className="w-3.5 h-3.5" />
              <span>Temizle</span>
            </button>
          </div>
        </div>

        {/* Editor & Validation Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* XML Editor Area */}
          <div className="lg:col-span-7 space-y-2">
            <label htmlFor="ubl-xml-textarea" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              UBL-TR XML İçeriği ({xmlInput.length.toLocaleString('tr-TR')} karakter)
            </label>
            <textarea
              id="ubl-xml-textarea"
              value={xmlInput}
              onChange={(e) => setXmlInput(e.target.value)}
              placeholder="XML içeriğini buraya yapıştırın veya yukarıdan dosya yükleyin..."
              rows={18}
              className="w-full p-4 rounded-2xl border border-slate-300 dark:border-slate-800 bg-slate-950 text-slate-200 font-mono text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-brand-primary shadow-inner resize-y"
            />
          </div>

          {/* Validation & Summary Column */}
          <div className="lg:col-span-5 space-y-4">
            {/* Validation Status Card */}
            {validationResult && (
              <div
                className={`p-5 rounded-2xl border shadow-md backdrop-blur-sm space-y-3 ${
                  validationResult.ok
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : 'bg-rose-500/10 border-rose-500/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Şema & Yapısal Doğrulama
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${
                      validationResult.ok
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300'
                    }`}
                  >
                    {validationResult.ok ? (
                      <FaCheckCircle className="w-3.5 h-3.5" />
                    ) : (
                      <FaTimesCircle className="w-3.5 h-3.5" />
                    )}
                    <span>{validationResult.ok ? 'GEÇERLİ UBL' : 'HATALI XML'}</span>
                  </span>
                </div>

                <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
                  <div>
                    Doküman Türü: <strong>{validationResult.documentType || 'Belirsiz'}</strong>
                  </div>
                  {validationResult.invoiceId && (
                    <div>
                      Fatura No: <strong className="font-mono">{validationResult.invoiceId}</strong>
                    </div>
                  )}
                  {validationResult.profileId && (
                    <div>
                      Profil: <strong>{validationResult.profileId}</strong>
                    </div>
                  )}
                </div>

                {/* Issues List */}
                {validationResult.issues.length > 0 && (
                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Tespit Edilen Maddeler ({validationResult.issues.length}):
                    </span>
                    <div className="max-h-40 overflow-y-auto space-y-1 pr-1 text-xs">
                      {validationResult.issues.map((issue, idx) => (
                        <div
                          key={idx}
                          className={`p-2 rounded-lg flex items-start gap-2 ${
                            issue.severity === 'error'
                              ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300'
                              : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                          }`}
                        >
                          {issue.severity === 'error' ? (
                            <FaTimesCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          ) : (
                            <FaExclamationTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          )}
                          <div>
                            <span className="font-mono text-[11px] font-bold block">{issue.path}</span>
                            <span>{issue.message}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Invoice Commercial Summary Card */}
            {invoiceSummary && (
              <div className="p-5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-lg space-y-4 text-xs">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <FaReceipt className="text-brand-primary w-3.5 h-3.5" />
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                      Fatura Özet Dökümü
                    </h3>
                  </div>
                  {invoiceSummary.currency && (
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold font-mono">
                      {invoiceSummary.currency}
                    </span>
                  )}
                </div>

                {/* Parties */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-600 dark:text-slate-400">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/60 dark:border-slate-800/60 space-y-1">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Satıcı (Supplier)
                    </span>
                    <strong className="text-slate-900 dark:text-white block line-clamp-1">
                      {invoiceSummary.supplierName || 'Belirtilmedi'}
                    </strong>
                    <span className="font-mono text-[11px] text-slate-500">
                      VKN: {invoiceSummary.supplierVkn || '-'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/60 dark:border-slate-800/60 space-y-1">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Alıcı (Customer)
                    </span>
                    <strong className="text-slate-900 dark:text-white block line-clamp-1">
                      {invoiceSummary.customerName || 'Belirtilmedi'}
                    </strong>
                    <span className="font-mono text-[11px] text-slate-500">
                      VKN: {invoiceSummary.customerVkn || '-'}
                    </span>
                  </div>
                </div>

                {/* Monetary Totals */}
                <div className="p-3.5 rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-950/80 dark:to-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 space-y-1.5">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Mal/Hizmet Toplamı:</span>
                    <span className="font-mono font-semibold">
                      {invoiceSummary.lineExtensionAmount !== null
                        ? `₺${invoiceSummary.lineExtensionAmount.toFixed(2)}`
                        : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Hesaplanan KDV:</span>
                    <span className="font-mono font-semibold">
                      {invoiceSummary.taxAmount !== null ? `₺${invoiceSummary.taxAmount.toFixed(2)}` : '-'}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-sm">
                    <strong className="text-slate-900 dark:text-white">Ödenecek Tutar:</strong>
                    <strong className="text-emerald-600 dark:text-emerald-400 font-mono text-base">
                      {invoiceSummary.payableAmount !== null
                        ? `₺${invoiceSummary.payableAmount.toFixed(2)}`
                        : '-'}
                    </strong>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* API CTA */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-950 via-slate-900 to-blue-950 border border-indigo-500/30 text-white flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="space-y-1 text-center md:text-left">
            <h4 className="font-bold text-lg">UBL Doğrulamayı Kendi Yazılımınıza Bağlayın</h4>
            <p className="text-slate-300 text-xs sm:text-sm max-w-xl">
              <code className="text-indigo-300 font-mono">POST /api/v1/invoice/ubl-validate</code> uç noktası ile
              fatura göndermeden önce UBL-TR şema hatalarını otomatik olarak yakalayın.
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={handleCopyCurl}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm inline-flex items-center gap-1.5 transition-colors border border-slate-700"
            >
              {copiedCurl ? <FaCheck className="w-3.5 h-3.5 text-emerald-400" /> : <FaCode className="w-3.5 h-3.5" />}
              <span>{copiedCurl ? 'Kopyalandı' : 'cURL'}</span>
            </button>
            <Link
              href="/docs"
              className="px-4 py-2.5 rounded-xl bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs sm:text-sm transition-colors shadow"
            >
              API Referansı
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
