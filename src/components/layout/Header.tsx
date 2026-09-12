/**
 * @file Sitenin üst (header) bölümünü oluşturan bileşen.
 * @description Bu bileşen, site başlığını, ana navigasyon linklerini (desktop ve mobil için ayrı),
 *              ve tema (açık/koyu mod) değiştiriciyi içerir.
 *
 * Bu kabuk sadece layout/marka isleriyle ilgilenir; kullanici menüsü
 * ve mobil menü ayri sub-component'lere tasindi.
 */

"use client";

import Link from 'next/link';
import { useState } from 'react';
import { FaBars, FaTimes } from 'react-icons/fa';
import { useSession } from 'next-auth/react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { ThemeCustomizer } from '@/components/ui/ThemeCustomizer';
import { GlobalSearch } from '@/components/search/GlobalSearch';
import { LocaleSwitcher } from '@/components/layout/LocaleSwitcher';
import { Tooltip } from '@/components/ui/Tooltip';
import { UserMenu } from './header/UserMenu';
import { MobileMenu, MOBILE_NAV_LINKS } from './header/MobileMenu';

interface HeaderProps {
  /** Header'da gösterilecek site başlığı. */
  headerTitle: string;
}

/** Uzun selamlaşma başlıklarını marka için kısaltır (ör. "Merhaba, Ben X" → "X"). */
function shortBrandLabel(title: string): string {
  const trimmed = title.trim();
  const merhaba = trimmed.match(/^Merhaba,?\s+Ben\s+(.+)$/i);
  if (merhaba?.[1]) return merhaba[1].trim();
  if (trimmed.length <= 28) return trimmed;
  return `${trimmed.slice(0, 26).trimEnd()}…`;
}

const Header = ({ headerTitle }: HeaderProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { status } = useSession();
  const brandLabel = shortBrandLabel(headerTitle);

  return (
    <>
      {/* SkipLink, layout.tsx'te zaten merkezi olarak ekleniyor (tek kaynak). */}
      <header className="fixed top-2 sm:top-4 left-0 right-0 z-50 flex justify-center px-2 sm:px-4 fade-in">
        <div className="w-full max-w-6xl xl:max-w-7xl">
          <div className="flex items-center justify-between h-14 sm:h-16 bg-white/80 dark:bg-slate-900/80 border border-white/40 dark:border-slate-700/40 rounded-full shadow-lg backdrop-blur-sm backdrop-saturate-110 px-3 sm:px-5 lg:px-6 hover:shadow-xl hover:shadow-brand-primary/10 hover:backdrop-blur-md hover:backdrop-saturate-125 hover:bg-white/85 hover:dark:bg-slate-900/85 transition-all duration-500 ease-out gap-2 sm:gap-3">
            <Tooltip content="Ana sayfaya dön" side="bottom">
              <Link
                href="/"
                className="text-base sm:text-lg lg:text-xl font-bold text-slate-900 dark:text-white truncate min-w-0 max-w-[10rem] sm:max-w-[14rem] xl:max-w-[18rem] shrink hover:text-brand-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 rounded"
                aria-label="Ana Sayfa"
                title={headerTitle}
              >
                {brandLabel}
              </Link>
            </Tooltip>

            {/* Masaüstü Navigasyonu — xl altında hamburger (taşmayı önler) */}
            <nav aria-label="Ana navigasyon" className="hidden xl:flex items-center gap-0.5 min-w-0 flex-1 justify-center">
              {MOBILE_NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-slate-700 dark:text-slate-300 whitespace-nowrap py-2 px-2 rounded-lg min-h-[44px] flex items-center hover:bg-brand-primary/10 hover:text-brand-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
              <GlobalSearch />
              <span className="hidden md:inline-flex">
                <LocaleSwitcher />
              </span>
              <ThemeToggle className="touch-target focus-ring" />
              <span className="hidden md:inline-flex">
                <ThemeCustomizer className="touch-target" />
              </span>

              {/* Kullanıcı menüsü (auth) */}
              {status !== 'loading' && <UserMenu />}

              {/* Mobil / tablet Menü Butonu */}
              <div className="xl:hidden">
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen((v) => !v)}
                  aria-label={isMobileMenuOpen ? 'Menüyü kapat' : 'Menüyü aç'}
                  aria-expanded={isMobileMenuOpen}
                  aria-controls="mobile-menu"
                  className="touch-target rounded-full hover:bg-brand-primary/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 relative overflow-hidden"
                >
                  <div className="relative w-5 h-5">
                    <FaBars
                      className={`absolute w-5 h-5 text-slate-700 dark:text-slate-300 transition-all duration-300 transform ${
                        isMobileMenuOpen ? 'rotate-90 opacity-0 scale-75' : 'rotate-0 opacity-100 scale-100'
                      }`}
                      aria-hidden="true"
                    />
                    <FaTimes
                      className={`absolute w-5 h-5 text-slate-700 dark:text-slate-300 transition-all duration-300 transform ${
                        isMobileMenuOpen ? 'rotate-0 opacity-100 scale-100' : '-rotate-90 opacity-0 scale-75'
                      }`}
                      aria-hidden="true"
                    />
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <MobileMenu open={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
    </>
  );
};

export default Header;
