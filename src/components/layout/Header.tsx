/**
 * @file Sitenin üst (header) bölümünü oluşturan bileşen.
 * @description Bu bileşen, site başlığını, ana navigasyon linklerini (desktop ve mobil için ayrı),
 *              ve tema (açık/koyu mod) değiştiriciyi içerir.
 */

"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { FaSun, FaMoon, FaBars, FaTimes } from 'react-icons/fa';

interface HeaderProps {
  /** Header'da gösterilecek site başlığı. */
  headerTitle: string;
}

const navLinks = [
  { href: "/hakkimda", label: "Hakkımda" },
  { href: "/projelerim", label: "Projelerim" },
  { href: "/blog", label: "Blog" },
  { href: "/iletisim", label: "İletişim" },
];

const Header = ({ headerTitle }: HeaderProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [isMounted, setIsMounted] = useState(false);

  // Bileşen mount edildikten sonra state'i güncelle.
  // Bu, sunucu tarafı ile istemci tarafı arasında tema uyuşmazlığını önler.
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Mobil menü açıkken body scroll'unu engelle
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.classList.add('body-scroll-lock');
    } else {
      document.body.classList.remove('body-scroll-lock');
    }

    // Cleanup function
    return () => {
      document.body.classList.remove('body-scroll-lock');
    };
  }, [isMobileMenuOpen]);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleMobileLinkClick = () => {
    setIsMobileMenuOpen(false);
  };

  /**
   * Tema değiştirici ikonu. Bileşen mount edilene kadar null döner.
   */
  const ThemeChangerIcon = () => {
    if (!isMounted) return null;

    return theme === 'dark' ? (
      <FaSun
        className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400"
      />
    ) : (
      <FaMoon
        className="w-5 h-5 sm:w-6 sm:h-6 text-gray-800 dark:text-gray-300"
      />
    );
  };

  return (
    <>
      <header className="fixed top-2 sm:top-4 left-0 right-0 z-50 flex justify-center px-2 sm:px-4 fade-in">
        <div className="w-full max-w-5xl">
          <div className="flex items-center justify-between h-14 sm:h-16 bg-white/90 dark:bg-black/90 border border-white/60 dark:border-black/60 rounded-full shadow-lg backdrop-blur-md px-3 sm:px-6 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300">
            <Link href="/" className="text-lg sm:text-xl lg:text-2xl font-bold text-light-text dark:text-white truncate flex-shrink min-w-0 mr-2 sm:mr-4 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300" aria-label="Ana Sayfa">
              <span className="block truncate max-w-[120px] sm:max-w-none">{headerTitle}</span>
            </Link>
            
            {/* Masaüstü Navigasyonu */}
            <nav className="hidden md:flex items-center space-x-2 lg:space-x-4 xl:space-x-6 flex-shrink-0">
              {navLinks.map((link, index) => (
                <Link key={link.href} href={link.href} className="text-sm lg:text-base text-light-text dark:text-gray-300 whitespace-nowrap py-2 px-2 lg:px-3 rounded-lg min-h-[40px] flex items-center hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 slide-in-right" style={{animationDelay: `${index * 0.1}s`}}>
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center space-x-1 flex-shrink-0">
              <button
                onClick={toggleTheme}
                aria-label={theme === 'dark' ? 'Açık moda geç' : 'Koyu moda geç'}
                className="touch-target rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-300 hover:scale-110 focus-ring"
              >
                <ThemeChangerIcon />
              </button>
              {/* Mobil Menü Butonu */}
              <div className="md:hidden">
                <button 
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
                  aria-label="Menüyü aç/kapat"
                  className="touch-target rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-300 focus-ring"
                >
                  {isMobileMenuOpen ? <FaTimes className="w-5 h-5 text-light-text dark:text-white" /> : <FaBars className="w-5 h-5 text-light-text dark:text-white" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobil Menü */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop Overlay */}
          <div
            className="md:hidden fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          {/* Menu Content */}
          <div
            className="md:hidden fixed top-[4.5rem] sm:top-20 left-3 right-3 sm:left-4 sm:right-4 z-50 bg-white/95 dark:bg-black/95 border border-white/90 dark:border-black/90 rounded-2xl shadow-xl backdrop-blur-md p-4 sm:p-6 max-h-[calc(100vh-6rem)] overflow-y-auto"
          >
            <nav className="flex flex-col space-y-1">
              {navLinks.map((link, index) => (
                <div key={link.href}>
                  <Link 
                    href={link.href} 
                    className="text-gray-700 dark:text-gray-300 rounded-xl px-4 py-4 text-lg font-medium touch-target hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 focus-ring" 
                    onClick={handleMobileLinkClick}
                  >
                    {link.label}
                  </Link>
                </div>
              ))}
            </nav>
          </div>
        </>
      )}
    </>
  );
};

export default Header;
