'use client';

/**
 * SiteChrome — kök Header/Footer/main sarmalayıcı.
 * /saas, /admin, /call rotalarında kendi chrome'ları olduğu için
 * portföy Header/Footer gizlenir (çift header önlenir).
 */

import { usePathname } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import type { About } from '@prisma/client';

const BARE_PREFIXES = ['/admin'] as const;

function isBareRoute(pathname: string): boolean {
  return BARE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

interface SiteChromeProps {
  headerTitle: string;
  aboutData: About | null;
  children: React.ReactNode;
}

export function SiteChrome({ headerTitle, aboutData, children }: SiteChromeProps) {
  const pathname = usePathname() || '/';
  const bare = isBareRoute(pathname);

  if (bare) {
    return (
      <div className="relative flex flex-col min-h-screen surface-transition">
        <div id="main-content" tabIndex={-1} className="flex-grow focus:outline-none">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col min-h-screen surface-transition">
      <Header headerTitle={headerTitle} />
      <main
        id="main-content"
        tabIndex={-1}
        className="flex-grow w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 pt-20 sm:pt-24 pb-8 focus:outline-none"
      >
        {children}
      </main>
      <Footer aboutData={aboutData} />
    </div>
  );
}

export default SiteChrome;
