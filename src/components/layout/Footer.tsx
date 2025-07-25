"use client";

import { FaGithub, FaLinkedin, FaInstagram } from 'react-icons/fa';
import { usePathname } from 'next/navigation';
import { About } from '@prisma/client';

interface FooterProps {
  aboutData: About | null;
}

const Footer = ({ aboutData }: FooterProps) => {
  const pathname = usePathname();

  if (!aboutData) {
    return (
      <footer className="bg-light-bg dark:bg-dark-card border-t border-gray-200 dark:border-dark-border mt-8 sm:mt-12">
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-6 sm:py-8">
          <div className="text-center">
            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
              &copy; {new Date().getFullYear()} Portföyüm. Tüm Hakları Saklıdır.
            </p>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="bg-light-bg dark:bg-dark-card border-t border-gray-200 dark:border-dark-border mt-8 sm:mt-12">
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-6 sm:py-8">
        <div className="flex flex-col items-center space-y-4 sm:space-y-6">
          {/* Sosyal Medya İkonları */}
          <div className="flex items-center justify-center space-x-2 sm:space-x-4">
            {aboutData.socialGithub && (
              <a 
                href={aboutData.socialGithub} 
                aria-label="GitHub profilim" 
                target="_blank" 
                rel="noopener noreferrer"
                className="min-w-[44px] min-h-[44px] w-11 h-11 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-light-text dark:hover:text-white transition-all duration-200 active:scale-95"
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
                className="min-w-[44px] min-h-[44px] w-11 h-11 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-light-text dark:hover:text-white transition-all duration-200 active:scale-95"
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
                className="min-w-[44px] min-h-[44px] w-11 h-11 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-light-text dark:hover:text-white transition-all duration-200 active:scale-95"
              >
                <FaInstagram size={20} className="sm:w-6 sm:h-6" />
              </a>
            )}
          </div>

          {/* Copyright Metni */}
          <div className="text-center">
            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
              &copy; {new Date().getFullYear()} {aboutData.name || "Portföyüm"}. Tüm Hakları Saklıdır.
            </p>
          </div>
          
          {/* Made by bilgisi - sadece ana sayfada */}
          {pathname === '/' && (
            <div className="text-center border-t border-gray-200 dark:border-gray-700 pt-4 w-full max-w-md">
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-2 text-xs sm:text-sm text-gray-400 dark:text-gray-500">
                <span>Made by:</span>
                <div className="flex items-center space-x-2">
                  <a 
                    href="https://noktanyus.com" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="underline hover:text-light-text dark:hover:text-white transition-colors font-medium"
                  >
                    noktanyus
                  </a>
                  <span>|</span>
                  <a 
                    href="https://github.com/noktanyus/noktanyus-porfoy" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="underline hover:text-light-text dark:hover:text-white transition-colors font-medium"
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
