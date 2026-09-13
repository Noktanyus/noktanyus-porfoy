"use client";

import { usePathname } from 'next/navigation';
import { About } from '@prisma/client';
import { NewsletterForm } from '@/components/newsletter/NewsletterForm';
import { SocialLinks } from './footer/SocialLinks';
import { LegalLinks } from './footer/LegalLinks';

interface FooterProps {
  aboutData: About | null;
}

const Footer = ({ aboutData }: FooterProps) => {
  const pathname = usePathname();

  if (!aboutData) {
    return (
      <footer className="glass-footer mt-8 sm:mt-12">
        <div className="container-responsive py-6 sm:py-8">
          <div className="text-center space-y-3">
            <LegalLinks />
            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">
              &copy; {new Date().getFullYear()} Portföyüm. Tüm Hakları Saklıdır.
            </p>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="glass-footer mt-8 sm:mt-12">
      <div className="container-responsive py-6 sm:py-8">
        <div className="flex flex-col items-center space-y-4 sm:space-y-6">
          {/* Newsletter - tüm ekranlarda göster */}
          <div className="w-full max-w-md">
            <NewsletterForm source="footer" variant="compact" />
          </div>

          {/* Sosyal Medya İkonları */}
          <SocialLinks
            github={aboutData.socialGithub}
            linkedin={aboutData.socialLinkedin}
            instagram={aboutData.socialInstagram}
          />

          {/* Yasal + gelir linkleri */}
          <LegalLinks />
          <nav
            aria-label="Gelir ve hizmet bağlantıları"
            className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400"
          >
            {[
              { href: '/magaza', label: 'Mağaza' },
              { href: '/docs', label: 'API Docs' },
              { href: '/iletisim', label: 'İletişim' },
            ].map((link, i, arr) => (
              <span key={link.href} className="inline-flex items-center gap-x-4">
                <a
                  href={link.href}
                  className="hover:text-brand-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary rounded"
                >
                  {link.label}
                </a>
                {i < arr.length - 1 && (
                  <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">
                    ·
                  </span>
                )}
              </span>
            ))}
          </nav>

          {/* Copyright Metni */}
          <div className="text-center space-y-2">
            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              &copy; {new Date().getFullYear()} {aboutData.name || 'Portföyüm'}. Tüm Hakları Saklıdır.
            </p>
            {pathname === '/' && (
              <p className="text-xs text-slate-400 dark:text-slate-500">
                <a
                  href="https://github.com/noktanyus/noktanyus-porfoy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline font-medium hover:text-brand-primary transition-colors"
                >
                  Open Source
                </a>
                <span className="mx-2" aria-hidden="true">·</span>
                <span>Noktanyus</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
