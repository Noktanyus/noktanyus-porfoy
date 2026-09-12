/**
 * @file SaaS layout — Pazarlama + uygulama sayfaları için ortak chrome.
 * @description Tüm /saas/* sayfalarını saran layout. Header'da landing linkleri
 *              + auth-aware login/dashboard yönlendirmesi bulunur. Footer
 *              minimal — sadece linkler ve telif.
 *
 *              Server component: session kontrolü için getServerSession kullanır.
 *              Bu layout altındaki (app) grubu ek auth kontrolü yapar (uygulama
 *              sayfaları için zorunlu).
 */

import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const metadata = {
  title: 'Noktanyus SaaS · AI Ürün Açıklaması',
  description:
    'Yapay zeka ile ürün açıklaması üretin. Toplu CSV yükleme, marka sesi eğitimi, 6 dilde içerik.',
};

export default async function SaasLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <header className="sticky top-0 z-40 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/saas" className="flex items-center gap-2 font-bold text-lg">
            <span
              aria-hidden="true"
              className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-primary to-purple-600 flex items-center justify-center text-white"
            >
              ✦
            </span>
            <span>Noktanyus SaaS</span>
          </Link>

          <nav aria-label="Ana menü" className="hidden md:flex items-center gap-6 text-sm">
            <Link href="/saas#features" className="text-gray-600 dark:text-gray-300 hover:text-brand-primary transition-colors">
              Özellikler
            </Link>
            <Link href="/saas#pricing" className="text-gray-600 dark:text-gray-300 hover:text-brand-primary transition-colors">
              Fiyatlandırma
            </Link>
            <Link href="/saas#faq" className="text-gray-600 dark:text-gray-300 hover:text-brand-primary transition-colors">
              SSS
            </Link>
            <Link href="/api/docs" className="text-gray-600 dark:text-gray-300 hover:text-brand-primary transition-colors">
              API
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            {session ? (
              <Link
                href="/saas/dashboard"
                className="inline-flex items-center justify-center min-h-[40px] px-4 rounded-lg bg-brand-primary text-white text-sm font-semibold hover:bg-brand-primary/90"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/giris"
                  className="hidden sm:inline-flex items-center justify-center min-h-[40px] px-3 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-brand-primary"
                >
                  Giriş Yap
                </Link>
                <Link
                  href="/kayit"
                  className="inline-flex items-center justify-center min-h-[40px] px-4 rounded-lg bg-brand-primary text-white text-sm font-semibold hover:bg-brand-primary/90"
                >
                  Ücretsiz Başla
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Kök layout'ta zaten <main id="main-content"> var — iç içe main olmasın */}
      <div className="flex-1">{children}</div>

      <footer className="border-t border-gray-200 dark:border-gray-800 mt-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="font-bold mb-2">Noktanyus SaaS</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              AI ile ürün açıklaması üretin · Marka sesinizi öğretin · 6 dilde yayınlayın.
            </p>
          </div>
          <div>
            <p className="font-semibold mb-2 text-sm">Ürün</p>
            <ul className="space-y-1.5 text-sm text-gray-600 dark:text-gray-400">
              <li><Link href="/saas#features">Özellikler</Link></li>
              <li><Link href="/saas#pricing">Fiyatlandırma</Link></li>
              <li><Link href="/api/docs">API Dokümantasyonu</Link></li>
            </ul>
          </div>
          <div>
            <p className="font-semibold mb-2 text-sm">Destek</p>
            <ul className="space-y-1.5 text-sm text-gray-600 dark:text-gray-400">
              <li><Link href="/saas#faq">SSS</Link></li>
              <li><Link href="/iletisim">İletişim</Link></li>
              <li><Link href="/legal/gizlilik">Gizlilik</Link></li>
            </ul>
          </div>
          <div>
            <p className="font-semibold mb-2 text-sm">Hesap</p>
            <ul className="space-y-1.5 text-sm text-gray-600 dark:text-gray-400">
              <li><Link href="/giris">Giriş</Link></li>
              <li><Link href="/kayit">Kayıt Ol</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-200 dark:border-gray-800">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 text-xs text-gray-500 dark:text-gray-400 flex justify-between">
            <span>© {new Date().getFullYear()} Noktanyus · Tüm hakları saklıdır.</span>
            <span>v2.0 · Made in Türkiye</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
