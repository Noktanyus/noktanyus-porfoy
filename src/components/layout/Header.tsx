"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { FaSun, FaMoon, FaBars, FaTimes } from 'react-icons/fa';

const Header = ({ headerTitle }: { headerTitle: string }) => {
  const [isLiveMenuOpen, setIsLiveMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  let liveMenuTimer: NodeJS.Timeout;

  const handleLiveMenuEnter = () => {
    clearTimeout(liveMenuTimer);
    setIsLiveMenuOpen(true);
  };

  const handleLiveMenuLeave = () => {
    liveMenuTimer = setTimeout(() => {
      setIsLiveMenuOpen(false);
    }, 200); // 200ms delay before closing
  };

  const renderThemeChanger = () => {
    if (!mounted) return null;
    const currentTheme = theme === "system" ? "light" : theme;

    if (currentTheme === "dark") {
      return <FaSun className="w-6 h-6 text-yellow-400" role="button" onClick={() => setTheme('light')} />;
    } else {
      return <FaMoon className="w-6 h-6 text-gray-800" role="button" onClick={() => setTheme('dark')} />;
    }
  };

  return (
    <>
      <header className="fixed top-4 left-0 right-0 z-50 flex justify-center">
        <div className="w-full max-w-5xl mx-4">
          <div className="flex items-center justify-between h-16 bg-white/30 dark:bg-black/30 border border-white/40 dark:border-black/40 rounded-full shadow-lg backdrop-blur-xl px-6">
            <Link href="/" className="text-2xl font-bold text-light-text dark:text-white">
              {headerTitle}
            </Link>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              <Link href="/hakkimda" className="text-light-text dark:text-gray-300 hover:text-brand-primary dark:hover:text-brand-primary transition-colors">Hakkımda</Link>
              <Link href="/projelerim" className="text-light-text dark:text-gray-300 hover:text-brand-primary dark:hover:text-brand-primary transition-colors">Projelerim</Link>
              <Link href="/blog" className="text-light-text dark:text-gray-300 hover:text-brand-primary dark:hover:text-brand-primary transition-colors">Blog</Link>
              <Link href="/iletisim" className="text-light-text dark:text-gray-300 hover:text-brand-primary dark:hover:text-brand-primary transition-colors">İletişim</Link>
            </nav>

            <div className="flex items-center space-x-4">
              {renderThemeChanger()}
              <div className="md:hidden">
                <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                  {isMobileMenuOpen ? <FaTimes className="w-6 h-6 text-light-text dark:text-white" /> : <FaBars className="w-6 h-6 text-light-text dark:text-white" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden fixed top-24 left-4 right-4 z-40 bg-white/80 dark:bg-black/80 border border-white/90 dark:border-black/90 rounded-lg shadow-lg backdrop-blur-xl p-4"
          >
            <nav className="flex flex-col space-y-4">
              <Link href="/hakkimda" className="text-gray-700 dark:text-gray-300 hover:text-brand-primary dark:hover:text-brand-primary transition-colors" onClick={() => setIsMobileMenuOpen(false)}>Hakkımda</Link>
              <Link href="/projelerim" className="text-gray-700 dark:text-gray-300 hover:text-brand-primary dark:hover:text-brand-primary transition-colors" onClick={() => setIsMobileMenuOpen(false)}>Projelerim</Link>
              <Link href="/blog" className="text-gray-700 dark:text-gray-300 hover:text-brand-primary dark:hover:text-brand-primary transition-colors" onClick={() => setIsMobileMenuOpen(false)}>Blog</Link>
              <Link href="/iletisim" className="text-gray-700 dark:text-gray-300 hover:text-brand-primary dark:hover:text-brand-primary transition-colors" onClick={() => setIsMobileMenuOpen(false)}>İletişim</Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;
