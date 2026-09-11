'use client';

/**
 * Public site chrome (Header + Footer + padded main).
 * Admin ve dashboard kendi shell'lerini kullanır — burada chrome gizlenir.
 */

import { usePathname } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ChatWidget from '@/components/chat/ChatWidget';
import type { About } from '@prisma/client';

interface SiteChromeProps {
  children: React.ReactNode;
  headerTitle: string;
  aboutData: About | null;
}

function isAppShellPath(pathname: string | null): boolean {
  if (!pathname) return false;
  return (
    pathname === '/admin' ||
    pathname.startsWith('/admin/') ||
    pathname === '/dashboard' ||
    pathname.startsWith('/dashboard/')
  );
}

export function SiteChrome({ children, headerTitle, aboutData }: SiteChromeProps) {
  const pathname = usePathname();
  const appShell = isAppShellPath(pathname);

  if (appShell) {
    return (
      <div className="relative min-h-screen">
        <div id="main-content" tabIndex={-1} className="focus:outline-none">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col min-h-screen">
      <Header headerTitle={headerTitle} />
      <main
        id="main-content"
        tabIndex={-1}
        className="flex-grow w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 pt-20 sm:pt-24 pb-8 focus:outline-none"
      >
        <div className="w-full">{children}</div>
      </main>
      <Footer aboutData={aboutData} />
      <ChatWidget />
    </div>
  );
}
