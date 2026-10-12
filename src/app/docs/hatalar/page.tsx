import type { Metadata } from 'next';
import Link from 'next/link';
import { FaExclamationTriangle, FaShieldAlt, FaRedo, FaCheck } from 'react-icons/fa';

export const metadata: Metadata = {
  title: 'API Hata Kodları & Hata Sözleşmesi — Noktanyus',
  description:
    'Noktanyus API HTTP durumları, makine okunabilir error.code değerleri, retry önerileri ve hata sözleşmesi.',
  alternates: { canonical: '/docs/hatalar' },
  openGraph: {
    title: 'API Hata Kodları — Noktanyus',
    description: 'VALIDATION, kota, rate limit ve auth hata sözleşmesi.',
    url: 'https://noktanyus.com/docs/hatalar',
  },
};

type ErrorRow = {
  http: number;
  code: string;
  title: string;
  retryable: boolean;
  action: string;
  example: string;
};

const ERRORS: ErrorRow[] = [
  {
    http: 400,
    code: 'VALIDATION',
    title: 'Doğrulama Hatası (Validation)',
    retryable: false,
    action: 'İstek gövdesini OpenAPI şemasına göre düzeltin. Zorunlu alanların eksik veya veri tipinin geçersiz olduğunu belirtir.',
    example: JSON.stringify(
      {
        success: false,
        error: {
          code: 'VALIDATION',
          message: 'Gerekli alanlar eksik veya format hatalı.',
          details: { iban: 'Geçersiz IBAN kontrol hanesi.' },
        },
      },
      null,
      2
    ),
  },
  {
    http: 401,
    code: 'UNAUTHORIZED',
    title: 'Yetkilendirme Hatası (Unauthorized)',
    retryable: false,
    action: 'x-api-key veya Authorization: Bearer başlığı eksik. Dashboard → API Keys üzerinden oluşturduğunuz anahtarı ekleyin.',
    example: JSON.stringify(
      {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'x-api-key başlığı eksik veya geçersiz.',
        },
      },
      null,
      2
    ),
  },
  {
    http: 401,
    code: 'INVALID_KEY',
    title: 'Geçersiz veya İptal Edilmiş Anahtar',
    retryable: false,
    action: 'API anahtarının süresi dolmuş veya iptal edilmiş olabilir. Dashboard üzerinden yeni bir anahtar oluşturun.',
    example: JSON.stringify(
      {
        success: false,
        error: {
          code: 'INVALID_KEY',
          message: 'Belirtilen API anahtarı geçersiz veya süresi dolmuş.',
        },
      },
      null,
      2
    ),
  },
  {
    http: 402,
    code: 'QUOTA_EXCEEDED',
    title: 'Kota veya Kredi Bitti (Payment Required)',
    retryable: false,
    action: 'Aylık abonelik kotanız veya ön ödemeli kredi bakiyeniz tükendi. Mağaza üzerinden paket yükseltin veya kredi yükleyin.',
    example: JSON.stringify(
      {
        success: false,
        error: {
          code: 'QUOTA_EXCEEDED',
          message: 'Aylık istek kotası doldu veya bakiye yetersiz.',
        },
      },
      null,
      2
    ),
  },
  {
    http: 429,
    code: 'RATE_LIMITED',
    title: 'Hız Sınırı Aşıldı (Too Many Requests)',
    retryable: true,
    action: 'Dakika başına izin verilen istek sayısı aşıldı. Yanıttaki Retry-After süresi kadar bekleyin ve üstel geri çekilme (exponential backoff) uygulayın.',
    example: JSON.stringify(
      {
        success: false,
        error: {
          code: 'RATE_LIMITED',
          message: 'Dakika başına istek limiti aşıldı. Lütfen bekleyin.',
          retryAfter: 12,
        },
      },
      null,
      2
    ),
  },
  {
    http: 500,
    code: 'INTERNAL_ERROR',
    title: 'Sunucu Hatası (Internal Error)',
    retryable: true,
    action: 'Kısa bir bekleme sonrasında isteği 1-2 kez tekrarlayın. Sorun devam ederse yanıttaki X-Request-Id değeriyle destek talebi açın.',
    example: JSON.stringify(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Beklenmeyen sunucu hatası meydana geldi.',
          requestId: 'req_8f1a3e2b9c0d',
        },
      },
      null,
      2
    ),
  },
];

export default function ApiErrorsPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Başlık */}
      <header className="mb-8 space-y-3">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold tracking-wide uppercase">
          <FaExclamationTriangle className="text-[10px]" />
          <span>Hata Standartları &amp; Sözleşme</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          API Hata Kodları &amp; Sözleşmesi
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
          Noktanyus API, hata durumlarında tahmin edilebilir HTTP durum kodları ve makine tarafından okunabilir{' '}
          <code className="text-sm font-mono text-brand-primary font-semibold">error.code</code> değerleri döner.
          Entegrasyonlarınızda metin kontrolü yerine sabit hata kodlarına göre akış kurun.
        </p>
      </header>

      {/* Standart Zarf Kutusu */}
      <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
          <FaShieldAlt className="text-brand-primary" />
          <span>Standart Hata Zarfı (Response Envelope)</span>
        </h2>
        <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
          Tüm hata yanıtları <code className="font-mono">success: false</code> içerir ve{' '}
          <code className="font-mono">error</code> nesnesi altında toplanır. Yanıt başlıklarında yer alan{' '}
          <code className="font-mono">X-Request-Id</code> değeri hata izleme ve destek için saklanmalıdır.
        </p>
        <pre className="overflow-x-auto rounded-xl bg-slate-950 p-3.5 text-xs font-mono text-slate-200">
{`{
  "success": false,
  "error": {
    "code": "VALIDATION | UNAUTHORIZED | QUOTA_EXCEEDED | RATE_LIMITED | INTERNAL_ERROR",
    "message": "Açıklayıcı Türkçe hata mesajı",
    "details": { ... } // Varsa alan bazlı detaylar
  }
}`}
        </pre>
      </div>

      {/* Hata Kodları Listesi */}
      <div className="space-y-4">
        {ERRORS.map((row) => (
          <article
            key={`${row.http}-${row.code}`}
            id={row.code.toLowerCase()}
            className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-mono font-bold text-white dark:bg-slate-100 dark:text-slate-900">
                  HTTP {row.http}
                </span>
                <span className="inline-flex rounded-lg border border-brand-primary/30 bg-brand-primary/10 px-2.5 py-1 text-xs font-mono font-bold text-brand-primary">
                  {row.code}
                </span>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase ${
                  row.retryable
                    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                {row.retryable ? (
                  <>
                    <FaRedo className="text-[9px]" />
                    <span>Yeniden Denenebilir (Retryable)</span>
                  </>
                ) : (
                  <>
                    <FaCheck className="text-[9px]" />
                    <span>İsteği Düzeltin (Fix Request)</span>
                  </>
                )}
              </span>
            </div>

            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">{row.title}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">{row.action}</p>

            <div className="rounded-xl bg-slate-950 p-3.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
                Örnek JSON Yanıtı
              </span>
              <pre className="overflow-x-auto text-xs font-mono text-emerald-400 leading-relaxed">
                {row.example}
              </pre>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
