"use client";

import { FaGithub, FaLinkedin, FaInstagram } from 'react-icons/fa';
import { usePathname } from 'next/navigation';
import { About } from '@prisma/client';
import { NewsletterForm } from '@/components/newsletter/NewsletterForm';

interface FooterProps {
  aboutData: About | null;
}

const Footer = ({ aboutData }: FooterProps) => {
  const pathname = usePathname();

  if (!aboutData) {
    return (
      <footer className="glass-footer mt-8 sm:mt-12">
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-6 sm:py-8">
          <div className="text-center space-y-3">
            <nav
              aria-label="Yasal bilgilendirme bağlantıları"
              className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400"
            >
              <a href="/yasal/kvkk" className="hover:text-brand-primary transition-colors">KVKK</a>
              <span aria-hidden="true" className="text-gray-300 dark:text-gray-600">·</span>
              <a href="/yasal/mesafeli-satis" className="hover:text-brand-primary transition-colors">Mesafeli Satış</a>
              <span aria-hidden="true" className="text-gray-300 dark:text-gray-600">·</span>
              <a href="/yasal/cerez-politikasi" className="hover:text-brand-primary transition-colors">Çerez Politikası</a>
              <span aria-hidden="true" className="text-gray-300 dark:text-gray-600">·</span>
              <a href="/yasal/cayma-hakki" className="hover:text-brand-primary transition-colors">Cayma Hakkı</a>
              <span aria-hidden="true" className="text-gray-300 dark:text-gray-600">·</span>
              <a href="/yasal/gizlilik" className="hover:text-brand-primary transition-colors">Gizlilik</a>
            </nav>
            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
              &copy; {new Date().getFullYear()} Portföyüm. Tüm Hakları Saklıdır.
            </p>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="glass-footer mt-8 sm:mt-12">
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-6 sm:py-8">
        <div className="flex flex-col items-center space-y-4 sm:space-y-6">
          {/* Newsletter - tüm ekranlarda göster */}
          <div className="w-full max-w-md">
            <NewsletterForm source="footer" variant="compact" />
          </div>

          {/* Sosyal Medya İkonları */}
          <div className="flex items-center justify-center space-x-2 sm:space-x-4">
            {aboutData.socialGithub && (
              <a 
                href={aboutData.socialGithub} 
                aria-label="GitHub profilim" 
                target="_blank" 
                rel="noopener noreferrer"
                className="min-w-[44px] min-h-[44px] w-11 h-11 flex items-center justify-center rounded-full text-gray-500 dark:text-gray-400 hover:text-brand-primary hover:scale-110 transition-all duration-300"
              >
                <FaGithub size={20} className="sm:w-6 sm:h-6" />
              </a>
            )}
            {aboutData.socialLinkedin && (
              <a 
                href={aboutData.socialLinkedin} 
                aria-label="LinkedIn profilim" 
                target="_blank" 
                rel="noopener noreferrer"
                className="min-w-[44px] min-h-[44px] w-11 h-11 flex items-center justify-center rounded-full text-gray-500 dark:text-gray-400 hover:text-brand-primary hover:scale-110 transition-all duration-300"
              >
                <FaLinkedin size={20} className="sm:w-6 sm:h-6" />
              </a>
            )}
            {aboutData.socialInstagram && (
              <a 
                href={aboutData.socialInstagram} 
                aria-label="Instagram profilim" 
                target="_blank" 
                rel="noopener noreferrer"
                className="min-w-[44px] min-h-[44px] w-11 h-11 flex items-center justify-center rounded-full text-gray-500 dark:text-gray-400 hover:text-brand-primary hover:scale-110 transition-all duration-300"
              >
                <FaInstagram size={20} className="sm:w-6 sm:h-6" />
              </a>
            )}
          </div>

          {/* Yasal Linkler */}
          <nav
            aria-label="Yasal bilgilendirme bağlantıları"
            className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400"
          >
            <a
              href="/yasal/kvkk"
              className="hover:text-brand-primary transition-colors"
            >
              KVKK
            </a>
            <span aria-hidden="true" className="text-gray-300 dark:text-gray-600">
              ·
            </span>
            <a
              href="/yasal/mesafeli-satis"
              className="hover:text-brand-primary transition-colors"
            >
              Mesafeli Satış
            </a>
            <span aria-hidden="true" className="text-gray-300 dark:text-gray-600">
              ·
            </span>
            <a
              href="/yasal/cerez-politikasi"
              className="hover:text-brand-primary transition-colors"
            >
              Çerez Politikası
            </a>
            <span aria-hidden="true" className="text-gray-300 dark:text-gray-600">
              ·
            </span>
            <a
              href="/yasal/cayma-hakki"
              className="hover:text-brand-primary transition-colors"
            >
              Cayma Hakkı
            </a>
            <span aria-hidden="true" className="text-gray-300 dark:text-gray-600">
              ·
            </span>
            <a
              href="/yasal/gizlilik"
              className="hover:text-brand-primary transition-colors"
            >
              Gizlilik
            </a>
          </nav>

          {/* Copyright Metni */}
          <div className="text-center space-y-2">
            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
              &copy; {new Date().getFullYear()} {aboutData.name || "Portföyüm"}. Tüm Hakları Saklıdır.
            </p>
            <p className="text-xs sm:text-sm text-gray-400 dark:text-gray-500 font-medium tracking-widest uppercase">
              Powered by <span className="text-orange-500 font-black">Noktanyus</span>
            </p>
          </div>
          
          {/* Made by bilgisi - sadece ana sayfada */}
          {pathname === '/' && (
            <div className="text-center border-t border-white/30 dark:border-white/10 pt-4 w-full max-w-md">
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-2 text-xs sm:text-sm text-gray-400 dark:text-gray-500">
                <span>Made by:</span>
                <div className="flex items-center space-x-2">
                  <a 
                    href="https://noktanyus.com" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="underline font-medium"
                  >
                    noktanyus
                  </a>
                  <span>|</span>
                  <a 
                    href="https://github.com/noktanyus/noktanyus-porfoy" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="underline font-medium"
                  >
                    Open Source
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
