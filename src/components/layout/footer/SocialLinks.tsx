'use client';

import { FaGithub, FaLinkedin, FaInstagram } from 'react-icons/fa';

interface SocialLinksProps {
  github?: string | null;
  linkedin?: string | null;
  instagram?: string | null;
}

/**
 * Tek bir veri kaynagi: SOCIAL_ITEMS. Eksik olan link render
 * edilmez; sadece mevcut olanlari sirayla gosterir.
 */
const SOCIAL_ITEMS = [
  { key: 'github' as const, hrefKey: 'github' as const, label: 'GitHub profilim', icon: FaGithub },
  { key: 'linkedin' as const, hrefKey: 'linkedin' as const, label: 'LinkedIn profilim', icon: FaLinkedin },
  { key: 'instagram' as const, hrefKey: 'instagram' as const, label: 'Instagram profilim', icon: FaInstagram },
] as const;

export function SocialLinks({ github, linkedin, instagram }: SocialLinksProps) {
  const hrefs = { github, linkedin, instagram };
  return (
    <div className="flex items-center justify-center space-x-2 sm:space-x-4">
      {SOCIAL_ITEMS.map(({ key, hrefKey, label, icon: Icon }) => {
        const href = hrefs[hrefKey];
        if (!href) return null;
        return (
          <a
            key={key}
            href={href}
            aria-label={label}
            target="_blank"
            rel="noopener noreferrer"
            className="min-w-[44px] min-h-[44px] w-11 h-11 flex items-center justify-center rounded-full text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:scale-110 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
          >
            <Icon size={20} className="sm:w-6 sm:h-6" aria-hidden="true" />
          </a>
        );
      })}
    </div>
  );
}
