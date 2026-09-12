/**
 * @file Yönetim panelindeki tüm sayfalara navigasyon sağlayan kenar çubuğu (sidebar) bileşeni.
 * @description Bu bileşen, yönetim panelindeki ana bölümlere linkler sunar,
 *              aktif sayfayı vurgular ve güvenli çıkış işlemi için bir buton içerir.
 *              Mobil cihazlarda drawer pattern kullanarak responsive davranış sergiler.
 *              Touch-friendly navigation ve proper mobile-first design ile optimize edilmiştir.
 *
 *              Bu kabuk yalnizca state yonetimi + scroll lock yapar. UI parcalari
 *              ./sidebar/* altindaki sub-component'lere tasindi. Link listesi
 *              ./sidebar/adminNavLinks.tsx icinde TEK kaynak olarak tutulur.
 *
 * Faz D düzeltmeleri:
 *  - `aria-hidden` masaüstünde de "true" kalıyordu; sidebar görünür olmasına
 *    rağmen ekran okuyucudan tamamen gizleniyordu. Artık görünürlük CSS
 *    (`invisible`/`lg:visible`) ile yönetilir; kapalı drawer hem a11y
 *    ağacından hem tab sırasından çıkar, masaüstünde ise erişilebilir kalır.
 *  - Elle yazılmış focus-trap DOM sorgusu kaldırıldı; `inert` benzeri
 *    görünürlük yaklaşımı ile kapalı drawer odaklanamaz hale geldiği için
 *    trap'e gerek kalmadı.
 *  - Link listesi ve aktif link mantığı tek kaynağa taşındı.
 */

"use client";

import { signOut } from "next-auth/react";
import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { HamburgerButton } from "./sidebar/HamburgerButton";
import { MobileBreadcrumb } from "./sidebar/MobileBreadcrumb";
import { AdminSidebarHeader } from "./sidebar/AdminSidebarHeader";
import { AdminSidebarNav } from "./sidebar/AdminSidebarNav";
import { AdminSidebarFooter } from "./sidebar/AdminSidebarFooter";

interface AdminSidebarProps {
  isMobileMenuOpen?: boolean;
  setIsMobileMenuOpen?: (open: boolean) => void;
}

const AdminSidebar = ({ isMobileMenuOpen = false, setIsMobileMenuOpen }: AdminSidebarProps) => {
  const [internalMobileMenuOpen, setInternalMobileMenuOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Use external state if provided, otherwise use internal state
  const isMobileOpen = setIsMobileMenuOpen ? isMobileMenuOpen : internalMobileMenuOpen;
  const setMobileOpen = setIsMobileMenuOpen ?? setInternalMobileMenuOpen;

  /* ===========================================================
   * Sidebar davranis: body scroll lock + ESC
   * =========================================================== */
  useEffect(() => {
    if (isMobileOpen) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollbarWidth}px`;
      document.documentElement.style.overflow = 'hidden';
      document.documentElement.style.height = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
      document.documentElement.style.overflow = '';
      document.documentElement.style.height = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
      document.documentElement.style.overflow = '';
      document.documentElement.style.height = '';
    };
  }, [isMobileOpen]);

  useEffect(() => {
    if (!isMobileOpen) return;
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileOpen(false);
    };
    document.addEventListener('keydown', handleEscapeKey);
    return () => document.removeEventListener('keydown', handleEscapeKey);
  }, [isMobileOpen, setMobileOpen]);

  /* ===========================================================
   * Aksiyonlar
   * =========================================================== */
  const handleSignOut = () => {
    if (window.confirm("Yönetim panelinden çıkmak istediğinize emin misiniz?")) {
      toast.success("Çıkış yapılıyor, yönlendiriliyorsunuz...");
      signOut({ callbackUrl: "/" });
    }
  };

  const handleMobileLinkClick = useCallback(() => {
    if (isMobileOpen) {
      setIsAnimating(true);
      setMobileOpen(false);
      setTimeout(() => setIsAnimating(false), 300);
    }
  }, [isMobileOpen, setMobileOpen]);

  const toggleMobileMenu = useCallback(() => {
    setIsAnimating(true);
    setMobileOpen(!isMobileOpen);
    setTimeout(() => setIsAnimating(false), 300);
  }, [isMobileOpen, setMobileOpen]);

  return (
    <>
      <HamburgerButton open={isMobileOpen} disabled={isAnimating} onToggle={toggleMobileMenu} />
      <MobileBreadcrumb />

      {/* Backdrop */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in-0"
          onClick={handleMobileLinkClick}
          aria-hidden="true"
          tabIndex={-1}
        />
      )}

      {/* Sidebar */}
      <aside
        id="admin-sidebar"
        className={`
          fixed lg:static inset-y-0 left-0 z-40 lg:z-auto
          w-80 sm:w-84 md:w-80 lg:w-72 xl:w-80 2xl:w-84
          max-w-[90vw] sm:max-w-[85vw] md:max-w-[320px] lg:max-w-none
          bg-card text-foreground
          flex flex-col shadow-2xl lg:shadow-xl
          transform transition-[transform,visibility] duration-500 ease-out
          lg:transform-none lg:transition-none
          ${isMobileOpen
            ? 'translate-x-0 visible'
            : '-translate-x-full invisible lg:translate-x-0 lg:visible'}
          overflow-hidden
          border-r border-border
          rounded-r-3xl lg:rounded-none
          backdrop-blur-xl
        `}
        aria-label="Yönetim paneli menüsü"
      >
        <AdminSidebarHeader onClose={isMobileOpen ? handleMobileLinkClick : undefined} />
        <AdminSidebarNav onNavigate={handleMobileLinkClick} />
        <AdminSidebarFooter
          onSignOut={() => {
            handleMobileLinkClick();
            handleSignOut();
          }}
          onNavigate={handleMobileLinkClick}
          disabled={isAnimating}
        />
      </aside>
    </>
  );
};

export default AdminSidebar;
