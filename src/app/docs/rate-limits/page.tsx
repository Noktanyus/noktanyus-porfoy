import type { Metadata } from 'next';
import Link from 'next/link';
import { FaClock, FaShieldAlt, FaLayerGroup } from 'react-icons/fa';

export const metadata: Metadata = {
  title: 'Rate Limits & Kota Yönetimi — Noktanyus API',
  description:
    'Dakikalık rate limit, aylık kota, Retry-After, X-RateLimit-Reset ve istek observability başlıkları; 429 ve 402 yanıtları.',
  alternates: { canonical: '/docs/rate-limits' },
};

const HEADERS = [
  {
    name: 'X-RateLimit-Limit',
    meaning: 'Dakika başına izin verilen maksimum istek adedi (API anahtarının tanımlı sınırıdır).',
  },
  {
    name: 'X-RateLimit-Remaining',
    meaning: 'İçinde bulunulan 60 saniyelik zaman penceresinde kalan istek hakkı.',
  },
  {
    name: 'X-RateLimit-Reset',
    meaning: 'Zaman penceresinin sıfırlanacağı Unix zaman damgası (saniye cinsinden UTC damgası).',
  },
  {
    name: 'Retry-After',
    meaning: 'HTTP 429 yanıtında sonraki isteği göndermek için kaç saniye beklemeniz gerektiğini belirtir.',
  },
  {
    name: 'X-Request-Id',
    meaning: 'Her API isteği için benzersiz üretilen UUID. Log eşleştirme ve destek talepleri için kullanılır.',
  },
  {
    name: 'X-Request-Duration',
    meaning: 'Sunucunun isteği işleme süresi (milisaniye cinsinden ölçüm).',
  },
];

export default function RateLimitsPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Başlık */}
      <header className="mb-8 space-y-3">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold tracking-wide uppercase">
          <FaClock className="text-[10px]" />
          <span>Hız Sınırları &amp; Kullanım Kotaları</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Rate Limit &amp; Kota Yönetimi
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
          Sistem kararlılığını ve yüksek erişilebilirliği korumak amacıyla tüm API anahtarlarına dakikalık istek sınırı ve
          hesap planınıza bağlı aylık kota uygulanır.
        </p>
      </header>

      {/* HTTP Durum Kartları */}
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 mb-2">
            <span className="rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-300 font-mono font-bold text-xs px-2.5 py-1">
              HTTP 429
            </span>
            <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
              RATE_LIMITED
            </span>
          </div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1">Dakikalık Hız Sınırı Aşıldı</h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Dakika penceresi dolduğunda döner. Yanıtta gelen <code className="font-mono">Retry-After</code> başlığındaki saniye kadar bekleyip isteği tekrarlayabilirsiniz.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 mb-2">
            <span className="rounded-lg bg-red-500/15 text-red-700 dark:text-red-300 font-mono font-bold text-xs px-2.5 py-1">
              HTTP 402
            </span>
            <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
              QUOTA_EXCEEDED
            </span>
          </div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1">Aylık Kota veya Kredi Bitti</h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Abonelik paketinizin aylık istek hakkı veya ön ödemeli bakiye tükendiğinde döner.{' '}
            <Link href="/magaza/abonelikler" className="text-brand-primary hover:underline font-medium">
              Plan Yükselt
            </Link>{' '}
            veya{' '}
            <Link href="/magaza/krediler" className="text-brand-primary hover:underline font-medium">
              Kredi Yükle
            </Link>
            .
          </p>
        </div>
      </div>

      {/* Yanıt Başlıkları Tablosu */}
      <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
          <FaLayerGroup className="text-brand-primary" />
          <span>Observability &amp; İstemci Başlıkları</span>
        </h2>
        <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
          Tüm API yanıtlarımızda istemcilerinizin limit durumunu anlık takip edebilmesi için aşağıdaki başlıklar döner:
        </p>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {HEADERS.map((h) => (
            <div key={h.name} className="py-3 flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4">
              <code className="text-xs sm:text-sm font-mono font-bold text-brand-primary sm:w-56 shrink-0">
                {h.name}
              </code>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">{h.meaning}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Canlı Takip Bağlantısı */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-brand-primary/5 border border-brand-primary/20 text-xs sm:text-sm">
        <span className="text-slate-700 dark:text-slate-300">
          API anahtarınızın anlık kalan limitini ve günlük kullanım grafiğini görmek ister misiniz?
        </span>
        <Link
          href="/dashboard/usage"
          className="px-4 py-2 rounded-xl bg-brand-primary font-semibold text-white hover:bg-brand-primary/90 transition-colors"
        >
          Canlı Kullanım Paneli →
        </Link>
      </div>
    </div>
  );
}
