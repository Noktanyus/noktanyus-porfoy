'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  FaSearch,
  FaCopy,
  FaCheck,
  FaArrowLeft,
  FaBuilding,
  FaMapMarkerAlt,
  FaCode,
  FaFileCode,
  FaInfoCircle,
  FaTimes,
} from 'react-icons/fa';
import {
  searchTaxOffices,
  generateUblTaxSchemeSnippet,
  TAX_OFFICES,
  type TaxOffice,
} from '@/modules/tr-api/taxOffices';
import { TrackRecentTool } from '@/components/tools/TrackRecentTool';

const PROVINCE_OPTIONS = [
  { code: '', name: 'Tüm İller' },
  { code: '34', name: '34 - İstanbul' },
  { code: '06', name: '06 - Ankara' },
  { code: '35', name: '35 - İzmir' },
  { code: '16', name: '16 - Bursa' },
  { code: '07', name: '07 - Antalya' },
  { code: '41', name: '41 - Kocaeli' },
  { code: '01', name: '01 - Adana' },
  { code: '42', name: '42 - Konya' },
  { code: '27', name: '27 - Gaziantep' },
  { code: '33', name: '33 - Mersin' },
  { code: '38', name: '38 - Kayseri' },
  { code: '26', name: '26 - Eskişehir' },
  { code: '55', name: '55 - Samsun' },
  { code: '21', name: '21 - Diyarbakır' },
  { code: '61', name: '61 - Trabzon' },
  { code: '20', name: '20 - Denizli' },
  { code: '54', name: '54 - Sakarya' },
  { code: '59', name: '59 - Tekirdağ' },
  { code: '10', name: '10 - Balıkesir' },
  { code: '45', name: '45 - Manisa' },
  { code: '48', name: '48 - Muğla' },
];

const POPULAR_QUERIES = [
  { label: 'Büyük Mükellefler', q: 'Büyük Mükellefler', p: '34' },
  { label: 'Kadıköy', q: 'Kadıköy', p: '34' },
  { label: 'Boğaziçi', q: 'Boğaziçi', p: '34' },
  { label: 'Beşiktaş', q: 'Beşiktaş', p: '34' },
  { label: 'Çankaya', q: 'Çankaya', p: '06' },
  { label: 'Yenimahalle', q: 'Yenimahalle', p: '06' },
  { label: 'Alsancak', q: 'Alsancak', p: '35' },
  { label: 'Kordon', q: 'Kordon', p: '35' },
  { label: 'İlyasbey (Gebze)', q: 'İlyasbey', p: '41' },
];

export default function TaxOfficeToolClient() {
  const [query, setQuery] = useState('');
  const [provinceCode, setProvinceCode] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [selectedOfficeForXml, setSelectedOfficeForXml] = useState<TaxOffice | null>(null);
  const [copiedXml, setCopiedXml] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);

  const results = useMemo(() => {
    return searchTaxOffices(query, {
      provinceCode: provinceCode || undefined,
      limit: 100,
    });
  }, [query, provinceCode]);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleCopyXml = (office: TaxOffice) => {
    const xml = generateUblTaxSchemeSnippet(office);
    navigator.clipboard.writeText(xml);
    setCopiedXml(true);
    setTimeout(() => setCopiedXml(false), 2000);
  };

  const handleCopyCurl = () => {
    const curl = `curl -X POST "https://noktanyus.com/api/v1/finance/tax-offices" \\\n  -H "x-api-key: YOUR_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{"query":"${query || 'kadıköy'}","provinceCode":"${provinceCode || '34'}"}'`;
    navigator.clipboard.writeText(curl);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  return (
    <div className="section-glass-hero bg-blob-decoration py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      <TrackRecentTool slug="vergi-dairesi-kodlari" title="Vergi Dairesi Kodları" />

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
            <FaBuilding className="w-3 h-3" />
            <span>GİB & UBL-TR e-Fatura Standartlarında Resmi Veritabanı</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white">
            Türkiye Vergi Dairesi Kodları & Arama Motoru
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
            e-Fatura, e-Arşiv ve şirket işlemleri için vergi dairesi adı, ilçe veya kod ile anında arama yapın.
            Resmi vergi dairesi kodunu ve UBL-TR XML parçacığını tek tıkla kopyalayın veya REST API ile sorgulayın.
          </p>
        </header>

        {/* Search & Filters */}
        <div className="p-6 sm:p-8 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xl backdrop-blur-sm space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-8 relative">
              <label htmlFor="tax-query-input" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Vergi Dairesi Adı, İlçe veya Kod
              </label>
              <div className="relative">
                <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="tax-query-input"
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Örn: Kadıköy, Boğaziçi, Çankaya veya 034262..."
                  className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary text-sm sm:text-base transition-shadow"
                />
                {query && (
                  <button
                    onClick={() => setQuery('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    aria-label="Aramayı Temizle"
                  >
                    <FaTimes className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="md:col-span-4">
              <label htmlFor="tax-province-select" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                İl Filtresi
              </label>
              <select
                id="tax-province-select"
                value={provinceCode}
                onChange={(e) => setProvinceCode(e.target.value)}
                className="w-full py-3 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-primary text-sm sm:text-base"
              >
                {PROVINCE_OPTIONS.map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Pill Filters */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Hızlı Seçim:
            </span>
            {POPULAR_QUERIES.map((item) => (
              <button
                key={item.label}
                onClick={() => {
                  setQuery(item.q);
                  setProvinceCode(item.p);
                }}
                className="px-2.5 py-1 text-xs rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-brand-primary/10 hover:text-brand-primary transition-colors border border-slate-200/80 dark:border-slate-700/80"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400 px-1">
          <div>
            Toplam <span className="font-bold text-slate-900 dark:text-white">{results.length}</span> vergi dairesi listeleniyor
            {provinceCode && ` (Plaka: ${provinceCode})`}
          </div>
          <button
            onClick={handleCopyCurl}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-primary hover:underline"
          >
            {copiedCurl ? <FaCheck className="w-3 h-3 text-emerald-500" /> : <FaCode className="w-3 h-3" />}
            <span>{copiedCurl ? 'cURL Kopyalandı' : 'cURL API İsteğini Kopyala'}</span>
          </button>
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {results.map((office) => {
            const isCodeCopied = copiedCode === office.code;
            return (
              <div
                key={office.code}
                className="p-5 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800/90 shadow-sm hover:shadow-md hover:border-brand-primary/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="font-bold text-base text-slate-900 dark:text-white leading-snug">
                      {office.name}
                    </h3>
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                        office.type === 'ihtisas'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                          : office.type === 'kurumlar'
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                      }`}
                    >
                      {office.type === 'ihtisas'
                        ? 'İhtisas'
                        : office.type === 'kurumlar'
                        ? 'Kurumlar'
                        : 'Müdürlük'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-4">
                    <FaMapMarkerAlt className="w-3 h-3 text-rose-500 shrink-0" />
                    <span>
                      {office.provinceName} ({office.provinceCode}) — {office.district}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      GİB Kodu:
                    </span>
                    <span className="font-mono font-bold text-sm text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                      {office.code}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopyCode(office.code)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                        isCodeCopied
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-brand-primary hover:text-white'
                      }`}
                    >
                      {isCodeCopied ? <FaCheck className="w-3 h-3" /> : <FaCopy className="w-3 h-3" />}
                      <span>{isCodeCopied ? 'Kopyalandı' : 'Kodu Kopyala'}</span>
                    </button>

                    <button
                      onClick={() => setSelectedOfficeForXml(office)}
                      title="UBL-TR e-Fatura XML parçacığını görüntüle"
                      className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-brand-primary transition-colors text-xs"
                      aria-label="XML Snippet"
                    >
                      <FaFileCode className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {results.length === 0 && (
          <div className="p-8 text-center rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
            <FaBuilding className="w-10 h-10 text-slate-400 mx-auto" />
            <h4 className="font-bold text-slate-800 dark:text-slate-200">Vergi dairesi bulunamadı</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Arama filtrenizi genişletin veya il seçimini &quot;Tüm İller&quot; yaparak tekrar deneyin.
            </p>
          </div>
        )}

        {/* XML Snippet Modal */}
        {selectedOfficeForXml && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FaFileCode className="w-4 h-4 text-brand-primary" />
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    UBL-TR e-Fatura PartyTaxScheme XML
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedOfficeForXml(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <FaTimes className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                {selectedOfficeForXml.name} ({selectedOfficeForXml.code}) için e-Fatura / e-Arşiv UBL standardına uygun XML bloğu:
              </p>

              <pre className="p-3.5 rounded-xl bg-slate-950 text-emerald-400 font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800">
                {generateUblTaxSchemeSnippet(selectedOfficeForXml)}
              </pre>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setSelectedOfficeForXml(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Kapat
                </button>
                <button
                  onClick={() => handleCopyXml(selectedOfficeForXml)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-brand-primary hover:bg-brand-primary-hover text-white flex items-center gap-1.5 shadow"
                >
                  {copiedXml ? <FaCheck className="w-3 h-3" /> : <FaCopy className="w-3 h-3" />}
                  <span>{copiedXml ? 'Kopyalandı!' : 'XML Kopyala'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Informative SEO Section */}
        <div className="p-6 sm:p-8 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 space-y-4">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold">
            <FaInfoCircle className="text-blue-500 w-4 h-4 shrink-0" />
            <h3 className="text-base sm:text-lg">Vergi Dairesi Kodu Nerede ve Nasıl Kullanılır?</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/60 dark:border-slate-800/60 space-y-1.5">
              <span className="font-bold text-slate-900 dark:text-white block">1. e-Fatura & e-Arşiv UBL</span>
              <p>
                GİB UBL-TR 1.2 standardında alıcının veya satıcının PartyTaxScheme alanında resmi 6 haneli vergi dairesi kodu zorunludur.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/60 dark:border-slate-800/60 space-y-1.5">
              <span className="font-bold text-slate-900 dark:text-white block">2. E-Ticaret B2B Checkout</span>
              <p>
                Müşterilerinize kurumsal fatura keserken hatalı veya rastgele metin girişini önlemek için canlı autocomplete olarak bağlayabilirsiniz.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/60 dark:border-slate-800/60 space-y-1.5">
              <span className="font-bold text-slate-900 dark:text-white block">3. Şirket Kuruluşu & Sözleşme</span>
              <p>
                Limited ve Anonim şirket ana sözleşmelerinde, kira sözleşmelerinde ve noter onaylarında resmi müdürlük adı eşleşmesi sağlar.
              </p>
            </div>
          </div>
        </div>

        {/* API CTA */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 border border-blue-500/30 text-white flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="space-y-1 text-center md:text-left">
            <h4 className="font-bold text-lg">Bu Veritabanını REST API Olarak Kullanın</h4>
            <p className="text-slate-300 text-xs sm:text-sm max-w-xl">
              <code className="text-sky-300 font-mono">POST /api/v1/finance/tax-offices</code> uç noktası ile kendi ERP, CRM veya e-ticaret sitenize
              anında bağlayın.
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
