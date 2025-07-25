/**
 * @file Yönetim panelindeki tüm sayfalara navigasyon sağlayan kenar çubuğu (sidebar) bileşeni.
 * @description Bu bileşen, yönetim panelindeki ana bölümlere linkler sunar,
 *              aktif sayfayı vurgular ve güvenli çıkış işlemi için bir buton içerir.
 *              Mobil cihazlarda drawer pattern kullanarak responsive davranış sergiler.
 *              Touch-friendly navigation ve proper mobile-first design ile optimize edilmiştir.
 */

"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { 
  FaTachometerAlt, FaUserEdit, FaProjectDiagram, FaBroadcastTower, 
  FaBlog, FaEnvelopeOpenText, FaCog, FaSignOutAlt, 
  FaEye, FaHome, FaHistory, FaImages, FaBars, FaTimes
} from "react-icons/fa";

interface AdminSidebarProps {
  isMobileMenuOpen?: boolean;
  setIsMobileMenuOpen?: (open: boolean) => void;
}

const AdminSidebar = ({ isMobileMenuOpen = false, setIsMobileMenuOpen }: AdminSidebarProps) => {
  const pathname = usePathname();
  const [internalMobileMenuOpen, setInternalMobileMenuOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Use external state if provided, otherwise use internal state
  const isMobileOpen = setIsMobileMenuOpen ? isMobileMenuOpen : internalMobileMenuOpen;
  const setMobileOpen = setIsMobileMenuOpen || setInternalMobileMenuOpen;

  // Kenar çubuğunda gösterilecek navigasyon linkleri ve ikonları
  const navLinks = [
    { href: "/admin/dashboard", text: "Gösterge Paneli", icon: <FaTachometerAlt /> },
    { href: "/admin/home-settings", text: "Ana Sayfa Ayarları", icon: <FaHome /> },
    { href: "/admin/hakkimda", text: "Hakkımda Sayfası", icon: <FaUserEdit /> },
    { href: "/admin/projects", text: "Proje Yönetimi", icon: <FaProjectDiagram /> },
    { href: "/admin/popups", text: "Popup Yönetimi", icon: <FaBroadcastTower /> },
    { href: "/admin/gallery", text: "Galeri", icon: <FaImages /> },
    { href: "/admin/blog", text: "Blog Yönetimi", icon: <FaBlog /> },
    { href: "/admin/messages", text: "Gelen Mesajlar", icon: <FaEnvelopeOpenText /> },
    { href: "/admin/seo", text: "SEO Ayarları", icon: <FaCog /> },
    { href: "/admin/history", text: "Değişiklik Geçmişi", icon: <FaHistory /> },
  ];

  // Mobil menü açıkken body scroll'unu engelle ve keyboard navigation ekle
  useEffect(() => {
    if (isMobileOpen) {
      // Scrollbar genişliğini hesapla ve layout shift'i önle
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollbarWidth}px`;
      
      // iOS Safari için additional fixes
      document.documentElement.style.overflow = 'hidden';
      document.documentElement.style.height = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
      document.documentElement.style.overflow = '';
      document.documentElement.style.height = '';
    }

    // Cleanup function
    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
      document.documentElement.style.overflow = '';
      document.documentElement.style.height = '';
    };
  }, [isMobileOpen]);

  // Escape tuşu ile mobil menüyü kapatma
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isMobileOpen) {
        setMobileOpen(false);
      }
    };

    if (isMobileOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      return () => {
        document.removeEventListener('keydown', handleEscapeKey);
      };
    }
  }, [isMobileOpen, setMobileOpen]);

  /**
   * Kullanıcıya onay sorduktan sonra oturumu sonlandırır ve ana sayfaya yönlendirir.
   */
  const handleSignOut = () => {
    if (window.confirm("Yönetim panelinden çıkmak istediğinize emin misiniz?")) {
      toast.success("Başarıyla çıkış yapıldı. Yönlendiriliyorsunuz...");
      signOut({ callbackUrl: "/" }); // Çıkış sonrası ana sayfaya yönlendir
    }
  };

  /**
   * Mobil menü linkine tıklandığında menüyü kapat (smooth animation ile)
   */
  const handleMobileLinkClick = useCallback(() => {
    if (isMobileOpen) {
      setIsAnimating(true);
      setMobileOpen(false);
      // Animation tamamlandıktan sonra animating state'ini temizle
      setTimeout(() => setIsAnimating(false), 300);
    }
  }, [isMobileOpen, setMobileOpen]);

  /**
   * Hamburger menü butonuna tıklandığında menüyü aç/kapat
   */
  const toggleMobileMenu = useCallback(() => {
    setIsAnimating(true);
    setMobileOpen(!isMobileOpen);
    // Animation tamamlandıktan sonra animating state'ini temizle
    setTimeout(() => setIsAnimating(false), 300);
  }, [isMobileOpen, setMobileOpen]);

  /**
   * Focus trap için ilk ve son focusable elementleri bul
   */
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Tab' && isMobileOpen) {
      const focusableElements = document.querySelectorAll(
        'aside[role="navigation"] a, aside[role="navigation"] button'
      );
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    }
  };

  return (
    <>
      {/* Hamburger Menu Button - Only visible on mobile with improved touch target */}
      <button
        onClick={toggleMobileMenu}
        aria-label={isMobileOpen ? "Menüyü kapat" : "Menüyü aç"}
        aria-expanded={isMobileOpen}
        aria-controls="admin-sidebar"
        disabled={isAnimating}
        className="lg:hidden fixed top-3 left-3 z-50 min-w-[48px] min-h-[48px] w-12 h-12 flex items-center justify-center rounded-xl bg-white dark:bg-dark-card shadow-lg border border-gray-200 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-gray-700 hover:shadow-xl transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div className="relative w-6 h-6 flex items-center justify-center">
          {/* Animated hamburger/close icon */}
          <div className={`absolute inset-0 transition-all duration-300 ${isMobileOpen ? 'rotate-180 opacity-0' : 'rotate-0 opacity-100'}`}>
            <FaBars className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </div>
          <div className={`absolute inset-0 transition-all duration-300 ${isMobileOpen ? 'rotate-0 opacity-100' : 'rotate-180 opacity-0'}`}>
            <FaTimes className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </div>
        </div>
      </button>

      {/* Mobile breadcrumb indicator - shows current section */}
      <div className="lg:hidden fixed top-3 right-3 z-40 pointer-events-none">
        <div className="bg-white/90 dark:bg-dark-card/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-sm border border-gray-200/50 dark:border-dark-border/50">
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
            {navLinks.find(link => {
              const isActive = link.href === "/admin/dashboard" 
                ? pathname === link.href 
                : pathname.startsWith(link.href);
              return isActive;
            })?.text || "Yönetim Paneli"}
          </span>
        </div>
      </div>

      {/* Backdrop Overlay - Only visible on mobile when menu is open with improved performance */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 mobile-backdrop-blur transition-all duration-300 animate-in fade-in-0"
          onClick={handleMobileLinkClick}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              handleMobileLinkClick();
            }
          }}
          aria-hidden="true"
          tabIndex={-1}
          style={{
            // Performance optimization for mobile devices
            willChange: 'opacity',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden'
          }}
        />
      )}

      {/* Sidebar with improved responsive behavior */}
      <aside
        id="admin-sidebar"
        className={`
          fixed lg:static inset-y-0 left-0 z-40 lg:z-auto
          w-80 sm:w-84 md:w-80 lg:w-64 xl:w-72 2xl:w-80
          max-w-[90vw] sm:max-w-[85vw] md:max-w-[320px] lg:max-w-none
          bg-white dark:bg-dark-card 
          text-light-text dark:text-dark-text 
          flex flex-col shadow-2xl lg:shadow-lg
          transform transition-all duration-300 ease-out lg:transform-none
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          overflow-hidden
          border-r border-gray-200 dark:border-dark-border
          rounded-r-2xl lg:rounded-none
        `}
        role="navigation"
        aria-label="Ana navigasyon menüsü"
        aria-hidden={!isMobileOpen ? 'true' : 'false'}
        onKeyDown={handleKeyDown}
        style={{
          // Performance optimizations for mobile
          willChange: 'transform',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden'
        }}
      >
        {/* Header with improved mobile layout */}
        <div className="p-4 sm:p-5 lg:p-6 border-b border-gray-200 dark:border-dark-border flex items-center justify-between flex-shrink-0 min-h-[72px] lg:min-h-[80px]">
          <Link 
            href="/admin/dashboard"
            onClick={handleMobileLinkClick}
            className="text-lg sm:text-xl lg:text-2xl font-bold hover:text-brand-primary transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 rounded-md touch-manipulation truncate flex-1 min-w-0 mr-2"
          >
            Yönetim Paneli
          </Link>
          {/* Close button for mobile - improved touch target */}
          <button
            onClick={handleMobileLinkClick}
            aria-label="Menüyü kapat"
            disabled={isAnimating}
            className="lg:hidden min-w-[48px] min-h-[48px] w-12 h-12 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 touch-manipulation flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaTimes className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Navigation with improved scrolling and spacing */}
        <nav 
          className="flex-1 px-3 sm:px-4 lg:px-4 py-4 sm:py-5 lg:py-6 space-y-1 sm:space-y-2 overflow-y-auto overflow-x-hidden mobile-scroll-container min-h-0"
          role="list"
        >
          {navLinks.map((link) => {
            // Aktif linki belirlemek için mevcut yolu (pathname) kontrol et.
            // Gösterge paneli için tam eşleşme, diğerleri için başlangıç eşleşmesi kullanılır.
            const isActive = link.href === "/admin/dashboard" 
              ? pathname === link.href 
              : pathname.startsWith(link.href);

            return (
              <Link 
                href={link.href} 
                key={link.href} 
                onClick={handleMobileLinkClick}
                className="block"
                role="listitem"
              >
                <div
                  className={`
                    flex items-center space-x-3 sm:space-x-4
                    px-3 sm:px-4 lg:px-4 py-3 sm:py-4 lg:py-3
                    min-h-[52px] sm:min-h-[56px] lg:min-h-[48px]
                    rounded-xl lg:rounded-lg transition-all duration-200
                    touch-manipulation
                    focus-within:outline-none focus-within:ring-2 focus-within:ring-brand-primary focus-within:ring-offset-2
                    group relative overflow-hidden
                    ${
                      isActive
                        ? "bg-brand-primary text-white font-semibold shadow-lg transform scale-[1.02] lg:scale-100" // Aktif link stili with subtle scale on mobile
                        : "hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600 hover:transform hover:scale-[1.01] lg:hover:scale-100" // Hover ve active stili
                    }
                  `}
                >
                  <span className="text-xl sm:text-2xl lg:text-xl flex-shrink-0 min-w-[28px] sm:min-w-[32px] lg:min-w-[24px] flex items-center justify-center">{link.icon}</span>
                  <span className="text-base sm:text-lg lg:text-base font-medium truncate flex-1 min-w-0 leading-tight">{link.text}</span>
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-r-full" />
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Footer Actions with improved touch targets */}
        <div className="px-3 sm:px-4 lg:px-4 py-4 sm:py-5 lg:py-6 border-t border-gray-200 dark:border-dark-border space-y-2 sm:space-y-3 flex-shrink-0">
          <a 
            href="/" 
            target="_blank" 
            rel="noopener noreferrer" 
            onClick={handleMobileLinkClick}
            className="
              w-full flex items-center space-x-3 sm:space-x-4
              px-3 sm:px-4 lg:px-4 py-3 sm:py-4 lg:py-3
              min-h-[52px] sm:min-h-[56px] lg:min-h-[48px]
              rounded-xl lg:rounded-lg text-left 
              hover:bg-gray-100 dark:hover:bg-gray-700 
              active:bg-gray-200 dark:active:bg-gray-600
              transition-all duration-200
              touch-manipulation
              focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2
              hover:transform hover:scale-[1.01] lg:hover:scale-100
            "
          >
            <span className="text-xl sm:text-2xl lg:text-xl flex-shrink-0 min-w-[28px] sm:min-w-[32px] lg:min-w-[24px] flex items-center justify-center"><FaEye /></span>
            <span className="text-base sm:text-lg lg:text-base font-medium flex-1 leading-tight">Siteyi Görüntüle</span>
          </a>
          <button
            onClick={() => {
              handleMobileLinkClick();
              handleSignOut();
            }}
            disabled={isAnimating}
            className="
              w-full flex items-center space-x-3 sm:space-x-4
              px-3 sm:px-4 lg:px-4 py-3 sm:py-4 lg:py-3
              min-h-[52px] sm:min-h-[56px] lg:min-h-[48px]
              rounded-xl lg:rounded-lg text-left 
              text-red-600 dark:text-red-500 
              hover:bg-red-50 dark:hover:bg-red-900/20
              active:bg-red-100 dark:active:bg-red-900/30
              transition-all duration-200
              touch-manipulation
              focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
              hover:transform hover:scale-[1.01] lg:hover:scale-100
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            <span className="text-xl sm:text-2xl lg:text-xl flex-shrink-0 min-w-[28px] sm:min-w-[32px] lg:min-w-[24px] flex items-center justify-center"><FaSignOutAlt /></span>
            <span className="text-base sm:text-lg lg:text-base font-medium flex-1 leading-tight">Güvenli Çıkış</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
