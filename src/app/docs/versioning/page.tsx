import type { Metadata } from 'next';
import Link from 'next/link';
import { API_VERSION } from '@/lib/apiVersion';
import { FaHistory, FaCalendarAlt, FaShieldAlt, FaExclamationCircle } from 'react-icons/fa';

export const metadata: Metadata = {
  title: 'API Versiyonlama & Yaşam Döngüsü — Noktanyus',
  description:
    'X-API-Version, Deprecation ve Sunset başlıkları; breaking change politikası ve IP güvenlik kuralları.',
  alternates: { canonical: '/docs/versioning' },
};

export default function VersioningDocsPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Başlık */}
      <header className="mb-8 space-y-3">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-500/10 text-slate-700 dark:text-slate-300 text-xs font-bold tracking-wide uppercase">
          <FaHistory className="text-[10px]" />
          <span>API Yaşam Döngüsü &amp; Değişiklik Yönetimi</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Versiyonlama &amp; Politika
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
          Noktanyus API, geriye dönük uyumluluk esasına göre yönetilir. Güncel sözleşme versiyon tarihi:{' '}
          <strong className="text-brand-primary font-mono">{API_VERSION}</strong>.
          Tüm yanıtlarımızda sürüm başlıkları şeffaf bir şekilde sunulur.
        </p>
      </header>

      {/* Sürüm Başlıkları */}
      <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
          <FaCalendarAlt className="text-brand-primary" />
          <span>Sürüm ve Yaşam Döngüsü Başlıkları</span>
        </h2>
        <div className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
          <div className="py-3">
            <code className="font-mono font-bold text-brand-primary">X-API-Version / API-Version</code>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
              İstek işlendiğinde geçerli olan tarih tabanlı sözleşme tarihi (örnek: <code className="font-mono text-xs">{API_VERSION}</code>).
            </p>
          </div>
          <div className="py-3">
            <code className="font-mono font-bold text-amber-600 dark:text-amber-400">Deprecation: true</code>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
              Yalnızca kullanım ömrünü tamamlamak üzere olan eski uç noktalarda döner. Aktif TR uçlarında bu başlık dönmez.
            </p>
          </div>
          <div className="py-3">
            <code className="font-mono font-bold text-amber-600 dark:text-amber-400">Sunset: &lt;HTTP-Date&gt;</code>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
              Deprecate edilen bir uç noktanın tamamen kapatılacağı son tarih damgası.
            </p>
          </div>
        </div>
      </section>

      {/* Güvenlik & IP Allowlist */}
      <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
          <FaShieldAlt className="text-emerald-500" />
          <span>IP Kısıtlaması (Allowlist) &amp; Güvenlik</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          Kurumsal entegrasyonlarda API anahtarlarınızı belirli IP veya CIDR bloklarına kısıtlayabilirsiniz.
          İzin verilen listenin dışındaki bir adresten gelen istekler derhal <code className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">403 IP_NOT_ALLOWED</code> kodu ile engellenir.
        </p>
        <div className="mt-4">
          <Link
            href="/dashboard/api-keys"
            className="text-xs font-semibold text-brand-primary hover:underline inline-flex items-center gap-1"
          >
            Dashboard &rarr; API Anahtarlarından IP Kısıtı Tanımla
          </Link>
        </div>
      </section>
    </div>
  );
}
