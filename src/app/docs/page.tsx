/**
 * @file /docs — TR Yardımcı API Referansı & Dokümantasyon Merkezi
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { DocsViewer } from '@/components/docs/DocsViewer';
import { FaKey, FaBolt, FaCheckCircle, FaSlidersH } from 'react-icons/fa';

export const metadata: Metadata = {
  title: 'TR API Referansı — Noktanyus',
  description:
    'Türkiye yardımcı API servisleri: doğrulama, finans, bordro, fatura, takvim ve coğrafya uçları. İstek formatları, başarılı/hatalı yanıtlar ve SDK örnekleri.',
  keywords: ['TR API', 'OpenAPI', 'IBAN', 'VKN', 'TCKN', 'Bordro API', 'API referansı', 'Redoc'],
  robots: { index: true, follow: true },
  alternates: { canonical: '/docs' },
  openGraph: {
    title: 'TR API Referansı — Noktanyus',
    description: 'Doğrulama, Finans, Takvim, Bordro ve Coğrafya REST API referansı.',
    type: 'website',
  },
};

export default function DocsPage() {
  return (
    <main className="pb-16">
      {/* Hero / Başlık Bölümü */}
      <section className="border-b border-slate-200/80 bg-white/60 dark:border-slate-800/80 dark:bg-slate-900/40">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-bold tracking-wide uppercase mb-3">
                <FaBolt className="text-[10px]" />
                <span>Resmi Geliştirici Dokümantasyonu</span>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
                TR Yardımcı API Referansı
              </h1>
              <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                130+ uç nokta ile Türkiye iş dünyası standartlarını tek bir API altında birleştirin:{' '}
                <strong className="text-slate-900 dark:text-white font-semibold">
                  TCKN/VKN, IBAN, KDV &amp; Tevkifat, Kıdem &amp; Bordro, E-Arşiv &amp; UBL, Kargo Desi
                </strong>{' '}
                ve daha fazlası.
              </p>
            </div>

            {/* Hızlı Başlangıç Özet Kartı */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950 md:w-80 shrink-0">
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Hızlı Başlangıç
                </span>
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <ol className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 font-bold text-[10px]">
                    1
                  </span>
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">API Key Al:</span>{' '}
                    <Link href="/dashboard/api-keys" className="text-brand-primary hover:underline font-medium">
                      Dashboard
                    </Link>{' '}
                    üzerinden oluştur.
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 font-bold text-[10px]">
                    2
                  </span>
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">Header Ekle:</span>{' '}
                    <code className="rounded bg-slate-100 px-1 py-0.5 text-[11px] font-mono dark:bg-slate-800">
                      x-api-key: ny_live_...
                    </code>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 font-bold text-[10px]">
                    3
                  </span>
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">İstek Gönder:</span>{' '}
                    Tüm uç noktalar standart JSON yanıtı döner.
                  </div>
                </li>
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* Ana Dokümantasyon Gezgini & Redoc Görüntüleyici */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <DocsViewer />
      </section>
    </main>
  );
}
