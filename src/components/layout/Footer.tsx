"use client";

import { FaGithub, FaLinkedin, FaTwitter } from 'react-icons/fa';
import { usePathname } from 'next/navigation';
import { About } from '@prisma/client';

interface FooterProps {
  aboutData: About | null;
}

const Footer = ({ aboutData }: FooterProps) => {
  const pathname = usePathname();

  if (!aboutData) {
    return (
      <footer className="bg-light-bg dark:bg-dark-card border-t border-gray-200 dark:border-dark-border mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-gray-500 dark:text-gray-400">
          <p>&copy; {new Date().getFullYear()} Portföyüm. Tüm Hakları Saklıdır.</p>
        </div>
      </footer>
    );
  }

  return (
    <footer className="bg-light-bg dark:bg-dark-card border-t border-gray-200 dark:border-dark-border mt-12">
      <div className="container mx-auto px-4 py-6 text-center text-gray-500 dark:text-gray-400">
        <div className="flex justify-center space-x-6 mb-4">
          {aboutData.socialGithub && (
            <a 
              href={aboutData.socialGithub} 
              aria-label="GitHub profilim" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-light-text dark:hover:text-white transition-colors"
            >
              <FaGithub size={24} />
            </a>
          )}
          {aboutData.socialLinkedin && (
            <a 
              href={aboutData.socialLinkedin} 
              aria-label="LinkedIn profilim" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-light-text dark:hover:text-white transition-colors"
            >
              <FaLinkedin size={24} />
            </a>
          )}
          {aboutData.socialTwitter && (
            <a 
              href={aboutData.socialTwitter} 
              aria-label="Twitter profilim" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-light-text dark:hover:text-white transition-colors"
            >
              <FaTwitter size={24} />
            </a>
          )}
        </div>
        <p className="mb-4">&copy; {new Date().getFullYear()} {aboutData.name || "Portföyüm"}. Tüm Hakları Saklıdır.</p>
        
        {pathname === '/' && (
          <div>
            <span className="text-sm">
              {'Made by: '}
              <a 
                href="https://noktanyus.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="underline hover:text-light-text dark:hover:text-white transition-colors"
              >
                noktanyus
              </a>
              {' | '}
              <a 
                href="https://github.com/noktanyus/noktanyus-porfoy" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="underline hover:text-light-text dark:hover:text-white transition-colors"
              >
                Open Source
              </a>
            </span>
          </div>
        )}
      </div>
    </footer>
  );
};

export default Footer;
