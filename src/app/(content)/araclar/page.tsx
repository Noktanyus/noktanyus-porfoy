import { Metadata } from 'next';
import Link from 'next/link';
import { FaCheckCircle, FaCalculator, FaCalendarAlt, FaIdCard, FaCode, FaBolt, FaShieldAlt } from 'react-icons/fa';
import { WELCOME_CREDITS, formatWelcomeCredits } from '@/lib/apiCredits';

export const metadata: Metadata = {
  title: 'Ücretsiz Geliştirici ve E-Ticaret Araçları | Noktanyus',
  description:
    'Online TR IBAN doğrulama, TCKN/VKN kontrolü, KDV ve tevkifat hesaplama, Türkiye iş günü hesaplama araçları. Hızlı, ücretsiz ve API destekli.',
  keywords: [
    'iban doğrulama',
    'tckn doğrulama',
    'vkn doğrulama',
    'kdv hesaplama',
    'tevkifat hesaplama',
    'iş günü hesaplama',
    'türkiye api',
    'geliştirici araçları',
  ],
  alternates: {
    canonical: 'https://noktanyus.com/araclar',
  },
  openGraph: {
    title: 'Ücretsiz Geliştirici ve E-Ticaret Araçları | Noktanyus',
    description: 'Online TR IBAN, TCKN, KDV Tevkifat ve İş Günü hesaplama araçları. API desteği ile.',
    url: 'https://noktanyus.com/araclar',
  },
};

const TOOLS = [
  {
    slug: 'iban-dogrulama',
    title: 'TR IBAN Doğrulama & Banka Bulucu',
    description:
      'Türkiye IBAN numarasını ISO 7064 MOD-97 algoritmasıyla doğrular, banka kodu ve resmi banka adını anında tespit eder.',
    icon: FaCheckCircle,
    color: 'from-blue-500 to-indigo-600',
    tag: 'En Çok Kullanılan',
  },
  {
    slug: 'tckn-vkn-dogrulama',
    title: 'TCKN & VKN Algoritma Doğrulama',
    description:
      '11 haneli T.C. Kimlik Numarası (tek/çift kuralı, 10-11. hane kontrolü) ve 10 haneli Vergi Kimlik Numarası algoritma kontrolü.',
    icon: FaIdCard,
    color: 'from-purple-500 to-pink-600',
    tag: 'E-Ticaret & Fatura',
  },
  {
    slug: 'kdv-tevkifat-hesaplama',
    title: 'KDV & Tevkifat Hesaplama Aracı',
    description:
      'Netten brüte veya brütten nete kuruş hassasiyetinde KDV ve resmi 2/10, 5/10, 7/10, 9/10 tevkifat oranları hesaplayıcı.',
    icon: FaCalculator,
    color: 'from-emerald-500 to-teal-600',
    tag: 'Muhasebe & Finans',
  },
  {
    slug: 'is-gunu-hesaplama',
    title: 'Türkiye İş Günü & Tatil Hesaplama',
    description:
      'İki tarih arasındaki resmi tatilleri ve hafta sonlarını filtreleyerek net iş günü sayısını ve tatil dökümünü hesaplar.',
    icon: FaCalendarAlt,
    color: 'from-amber-500 to-orange-600',
    tag: 'Operasyon & Hukuk',
  },
];

export default function AraclarPage() {
  return (
    <div className="section-glass-hero bg-blob-decoration py-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      <div className="relative z-10 space-y-12">
        {/* Header */}
        <header className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
            <FaBolt className="w-3 h-3" />
            <span>96+ Mikroservis Destekli Canlı Araçlar</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gradient-animated">
            Geliştirici & E-Ticaret Araçları
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            E-ticaret, muhasebe ve yazılım projeleriniz için Türkiye standartlarına uygun doğrulamaları ve hesaplamaları
            ücretsiz test edin veya API ile sisteminize bağlayın.
          </p>
        </header>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {TOOLS.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link
                key={tool.slug}
                href={`/araclar/${tool.slug}`}
                className="group relative p-6 sm:p-8 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 shadow-lg hover:shadow-2xl hover:border-brand-primary/40 transition-all duration-300 backdrop-blur-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tool.color} text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {tool.tag}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-brand-primary transition-colors mb-2">
                    {tool.title}
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {tool.description}
                  </p>
                </div>
                <div className="mt-6 flex items-center text-sm font-semibold text-brand-primary group-hover:translate-x-1 transition-transform duration-200">
                  <span>Hemen Kullan & Test Et</span>
                  <span className="ml-2">→</span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* API CTA Banner */}
        <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-r from-blue-900/90 via-indigo-900/90 to-purple-900/90 border border-indigo-500/30 text-white shadow-2xl backdrop-blur-md relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-brand-primary/20 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <div className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider font-bold text-emerald-400">
                <FaShieldAlt className="w-3.5 h-3.5" />
                <span>Kayıtta {formatWelcomeCredits(WELCOME_CREDITS)} ücretsiz API kredisi</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold">Bu Araçları Sisteminize Entegre Edin</h3>
              <p className="text-slate-300 text-sm sm:text-base max-w-xl">
                Shopify, WooCommerce, ERP veya mobil uygulamanıza REST API ile 2 dakikada bağlayın. Sub-millisecond hız ve
                kredi iade güvencesiyle.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <Link
                href="/docs"
                className="px-6 py-3 rounded-xl bg-white text-slate-900 font-bold hover:bg-slate-100 transition-colors shadow-lg flex items-center justify-center gap-2"
              >
                <FaCode className="w-4 h-4" />
                <span>API Referansı</span>
              </Link>
              <Link
                href="/kayit"
                className="px-6 py-3 rounded-xl bg-brand-primary hover:bg-brand-primary-hover text-white font-bold transition-colors shadow-lg flex items-center justify-center"
              >
                <span>API Anahtarı Al</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
