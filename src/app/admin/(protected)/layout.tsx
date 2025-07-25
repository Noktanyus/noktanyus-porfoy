/**
 * @file Korumalı yönetici sayfaları için ana layout.
 * @description Bu layout, kimlik doğrulaması gerektiren tüm yönetici sayfalarını
 *              (örn: /admin/dashboard, /admin/projects) sarmalar. Sayfalara
 *              responsive `AdminSidebar` ve bildirimler için `Toaster` bileşenlerini ekler.
 *              Mobile-first yaklaşımla tasarlanmış, responsive sidebar toggle functionality
 *              ve proper mobile navigation patterns içerir.
 */

"use client";

export const dynamic = 'force-dynamic';

import AdminSidebar from "@/components/admin/AdminSidebar";
import { Toaster } from "react-hot-toast";
import { useState, useEffect } from "react";

/**
 * Korumalı yönetici sayfalarının layout bileşeni.
 * @param {object} props - Bileşen propları.
 * @param {React.ReactNode} props.children - Sarmalanacak alt bileşenler (sayfa içeriği).
 */
export default function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen size and handle responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024; // lg breakpoint
      setIsMobile(mobile);
      
      // Auto-close mobile menu when switching to desktop
      if (!mobile && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };

    // Initial check
    checkMobile();

    // Add resize listener with debouncing for performance
    let timeoutId: NodeJS.Timeout;
    const debouncedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(checkMobile, 150);
    };

    // Add orientation change listener for mobile devices
    const handleOrientationChange = () => {
      // Small delay to allow viewport to adjust
      setTimeout(checkMobile, 200);
    };

    window.addEventListener('resize', debouncedResize);
    window.addEventListener('orientationchange', handleOrientationChange);
    
    return () => {
      window.removeEventListener('resize', debouncedResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
      clearTimeout(timeoutId);
    };
  }, [isMobileMenuOpen]);

  // Handle mobile menu close when clicking outside or navigation
  const handleMobileMenuClose = () => {
    if (isMobile) {
      setIsMobileMenuOpen(false);
    }
  };

  // Get current page title for mobile breadcrumb
  const getCurrentPageTitle = () => {
    if (typeof window === 'undefined') return 'Yönetim Paneli';
    
    const pathname = window.location.pathname;
    const pageMap: Record<string, string> = {
      '/admin/dashboard': 'Gösterge Paneli',
      '/admin/home-settings': 'Ana Sayfa Ayarları',
      '/admin/hakkimda': 'Hakkımda Sayfası',
      '/admin/projects': 'Proje Yönetimi',
      '/admin/popups': 'Popup Yönetimi',
      '/admin/gallery': 'Galeri',
      '/admin/blog': 'Blog Yönetimi',
      '/admin/messages': 'Gelen Mesajlar',
      '/admin/seo': 'SEO Ayarları',
      '/admin/history': 'Değişiklik Geçmişi',
    };

    // Check for exact matches first
    if (pageMap[pathname]) {
      return pageMap[pathname];
    }

    // Check for partial matches (for sub-pages)
    for (const [path, title] of Object.entries(pageMap)) {
      if (pathname.startsWith(path) && path !== '/admin/dashboard') {
        return title;
      }
    }

    return 'Yönetim Paneli';
  };

  return (
    // Ana kapsayıcı, mobile-first responsive sidebar ve ana içeriği düzenler.
    <div className="flex min-h-screen bg-gray-100 dark:bg-dark-bg text-light-text dark:text-dark-text relative">
      {/* Bildirim (toast) mesajlarının gösterileceği alan - responsive positioning */}
      <Toaster 
        position="top-right" 
        toastOptions={{
          className: 'text-sm sm:text-base',
          style: {
            marginTop: isMobile ? '80px' : '20px', // Account for mobile header
          }
        }}
      />
      
      {/* Responsive navigasyon menüsü - mobilde drawer, desktop'ta sidebar */}
      <AdminSidebar 
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />
      
      {/* Ana içerik alanı - mobile-first responsive design */}
      <main 
        className={`
          flex-1 w-full lg:w-auto min-w-0
          transition-all duration-300 ease-out
          ${isMobile ? 'pt-16 sm:pt-18 md:pt-20' : 'pt-0'}
          px-2 xs:px-3 sm:px-4 md:px-6 lg:px-8
          py-3 xs:py-4 sm:py-5 md:py-6 lg:py-8
          overflow-x-hidden
          ${isMobileMenuOpen && isMobile ? 'pointer-events-none opacity-50' : ''}
          ${isMobile ? 'pb-safe-area-inset-bottom' : ''}
          relative
        `}
        onClick={handleMobileMenuClose}
        style={{
          // Performance optimization for mobile
          willChange: isMobile ? 'transform' : 'auto',
          // Better mobile viewport handling
          minHeight: isMobile ? 'calc(100vh - 4rem)' : 'auto',
        }}
      >
        {/* Content container with responsive max-width and spacing */}
        <div className="mx-auto max-w-7xl w-full min-w-0">
          {/* Mobile-optimized content wrapper with improved spacing */}
          <div className="admin-content-spacing">
            {/* Mobile breadcrumb navigation for better UX */}
            {isMobile && (
              <div className="mb-4 sm:mb-6 sticky top-0 z-10">
                <div className="flex items-center justify-between bg-white/90 dark:bg-dark-card/90 backdrop-blur-md rounded-lg px-3 py-2 shadow-sm border border-gray-200/50 dark:border-dark-border/50">
                  <div className="flex items-center space-x-2 min-w-0 flex-1">
                    <div className="w-2 h-2 bg-brand-primary rounded-full flex-shrink-0 animate-pulse"></div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                      {getCurrentPageTitle()}
                    </span>
                  </div>
                  <button
                    onClick={() => setIsMobileMenuOpen(true)}
                    className="flex-shrink-0 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600 transition-all duration-200 touch-manipulation min-w-[40px] min-h-[40px] flex items-center justify-center"
                    aria-label="Menüyü aç"
                  >
                    <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
                      <div className="w-full h-full bg-gray-400 dark:bg-gray-500 rounded-sm transition-colors"></div>
                      <div className="w-full h-full bg-gray-400 dark:bg-gray-500 rounded-sm transition-colors"></div>
                      <div className="w-full h-full bg-gray-400 dark:bg-gray-500 rounded-sm transition-colors"></div>
                      <div className="w-full h-full bg-gray-400 dark:bg-gray-500 rounded-sm transition-colors"></div>
                    </div>
                  </button>
                </div>
              </div>
            )}
            
            {/* Sayfanın asıl içeriği burada render edilir. */}
            {children}
          </div>
        </div>
      </main>


    </div>
  );
}
