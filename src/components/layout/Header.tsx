/**
 * @file Sitenin üst (header) bölümünü oluşturan bileşen.
 * @description Bu bileşen, site başlığını, ana navigasyon linklerini (desktop ve mobil için ayrı),
 *              ve tema (açık/koyu mod) değiştiriciyi içerir.
 */

"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
        className="w-6 h-6 text-yellow-400 cursor-pointer transition-transform hover:scale-110"
        onClick={toggleTheme}
        aria-label="Açık moda geç"
      />
    ) : (
      <FaMoon
        className="w-6 h-6 text-gray-800 cursor-pointer transition-transform hover:scale-110"
        onClick={toggleTheme}
        aria-label="Koyu moda geç"
      />
    );
  };

  return (
    <>
      <header className="fixed top-4 left-0 right-0 z-50 flex justify-center">
        <div className="w-full max-w-5xl mx-4">
          <div className="flex items-center justify-between h-16 bg-white/30 dark:bg-black/30 border border-white/40 dark:border-black/40 rounded-full shadow-lg backdrop-blur-xl px-6">
            <Link href="/" className="text-2xl font-bold text-light-text dark:text-white" aria-label="Ana Sayfa">
              {headerTitle}
            </Link>
            
            {/* Masaüstü Navigasyonu */}
            <nav className="hidden md:flex items-center space-x-6">
              {navLinks.map(link => (
                <Link key={link.href} href={link.href} className="text-light-text dark:text-gray-300 hover:text-brand-primary dark:hover:text-brand-primary transition-colors">
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center space-x-4">
              <ThemeChangerIcon />
              {/* Mobil Menü Butonu */}
              <div className="md:hidden">
                <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} aria-label="Menüyü aç/kapat">
                  {isMobileMenuOpen ? <FaTimes className="w-6 h-6 text-light-text dark:text-white" /> : <FaBars className="w-6 h-6 text-light-text dark:text-white" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobil Menü */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden fixed top-24 left-4 right-4 z-40 bg-white/80 dark:bg-black/80 border border-white/90 dark:border-black/90 rounded-lg shadow-lg backdrop-blur-xl p-4"
          >
            <nav className="flex flex-col space-y-4">
              {navLinks.map(link => (
                <Link key={link.href} href={link.href} className="text-gray-700 dark:text-gray-300 hover:text-brand-primary dark:hover:text-brand-primary transition-colors" onClick={handleMobileLinkClick}>
                  {link.label}
                </Link>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;