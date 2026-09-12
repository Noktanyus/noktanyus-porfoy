'use client';

/**
 * @file MobileMenu - Header'daki mobil menü paneli.
 *
 * - body-scroll-lock class ile scroll lock
 * - ESC ile kapatma
 * - backdrop click ile kapatma
 * - 44px touch target
 * - Slide+fade animasyon
 */

import { useEffect } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { FaSearch, FaSignOutAlt } from 'react-icons/fa';
import { OPEN_EVENT } from '@/components/search/GlobalSearch';

export const MOBILE_NAV_LINKS = [
  { href: '/hakkimda', label: 'Hakkımda' },
  { href: '/projelerim', label: 'Projelerim' },
  { href: '/blog', label: 'Blog' },
  { href: '/magaza', label: 'Mağaza' },
  { href: '/fiyatlandirma', label: 'Fiyatlandırma' },
  { href: '/iletisim', label: 'İletişim' },
] as const;

const EXTRA_MOBILE_LINKS = [
  { href: '/randevu', label: 'Randevu' },
  { href: '/destek', label: 'Destek Ol' },
  { href: '/ortaklik', label: 'Affiliate' },
] as const;

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
}

export function MobileMenu({ open, onClose }: MobileMenuProps) {
  const { data: session } = useSession();

  useEffect(() => {
    if (!open) return;
    document.body.classList.add('body-scroll-lock');
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => {
      document.body.classList.remove('body-scroll-lock');
      window.removeEventListener('keydown', handleKey);
    };
  }, [open, onClose]);

  return (
    <div
      className={`xl:hidden fixed inset-0 z-40 transition-all duration-500 ease-out ${
        open ? 'opacity-100 visible' : 'opacity-0 invisible'
      }`}
      aria-hidden={!open}
    >
      <div
        className={`fixed inset-0 transition-all duration-700 ease-out ${
          open
            ? 'bg-black/40 backdrop-blur-sm opacity-100'
            : 'bg-black/0 backdrop-blur-none opacity-0'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className={`fixed top-[4.5rem] sm:top-20 left-3 right-3 sm:left-4 sm:right-4 z-50 bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl p-4 sm:p-6 max-h-[calc(100vh-6rem)] overflow-y-auto transition-all duration-700 ease-out transform ${
          open
            ? 'opacity-100 scale-100 translate-y-0 backdrop-blur-md'
            : 'opacity-0 scale-95 -translate-y-2 backdrop-blur-none'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Mobil menü"
      >
        <nav aria-label="Mobil navigasyon" className="flex flex-col space-y-1">
          <button
            type="button"
            onClick={() => {
              onClose();
              window.dispatchEvent(new Event(OPEN_EVENT));
            }}
            className="w-full text-left text-slate-700 dark:text-slate-300 rounded-xl px-4 py-4 text-lg font-medium min-h-[44px] hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 flex items-center gap-3"
          >
            <FaSearch className="w-4 h-4" aria-hidden="true" />
            Ara
            <span className="ml-auto text-xs text-slate-500 dark:text-slate-400">Ctrl+K</span>
          </button>

          {MOBILE_NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={onClose}
              className="text-slate-700 dark:text-slate-300 rounded-xl px-4 py-4 text-lg font-medium min-h-[44px] flex items-center hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
            >
              {link.label}
            </Link>
          ))}

          <div className="border-t border-slate-200 dark:border-slate-700 mt-2 pt-2">
            {EXTRA_MOBILE_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                className="text-slate-700 dark:text-slate-300 rounded-xl px-4 py-3 text-base font-medium min-h-[44px] flex items-center hover:bg-brand-primary/10 hover:text-brand-primary transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {session?.user ? (
            <>
              <Link
                href="/dashboard"
                onClick={onClose}
                className="text-slate-700 dark:text-slate-300 rounded-xl px-4 py-4 text-lg font-medium min-h-[44px] flex items-center hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors border-t border-slate-200 dark:border-slate-700 mt-2 pt-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
              >
                Dashboard
              </Link>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  signOut({ callbackUrl: '/' });
                }}
                className="w-full text-left text-rose-600 dark:text-rose-400 rounded-xl px-4 py-4 text-lg font-medium min-h-[44px] hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
              >
                <FaSignOutAlt className="w-4 h-4" aria-hidden="true" />
                Çıkış Yap
              </button>
            </>
          ) : (
            <Link
              href="/giris"
              onClick={onClose}
              className="text-slate-700 dark:text-slate-300 rounded-xl px-4 py-4 text-lg font-medium min-h-[44px] flex items-center hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors border-t border-slate-200 dark:border-slate-700 mt-2 pt-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
            >
              Giriş Yap
            </Link>
          )}
        </nav>
      </div>
    </div>
  );
}
