/**
 * @file Korumalı yönetici sayfaları için ana layout.
 * @description Bu layout, kimlik doğrulaması gerektiren tüm yönetici sayfalarını
 *              (örn: /admin/dashboard, /admin/projects) sarmalar. Sayfalara
 *              responsive `AdminSidebar` ve bildirimler için `Toaster` bileşenlerini ekler.
 *              Mobile-first yaklaşımla tasarlanmış, responsive sidebar toggle functionality
 *              ve proper mobile navigation patterns içerir.
 *
 * Faz D:
 *  - İç içe `<main>` kaldırıldı. Kök layout zaten `<main id="main-content">`
 *    render ediyor; burada ikinci bir main landmark HTML'i geçersiz kılıyor ve
 *    ekran okuyucuda iki "ana içerik" bölgesi oluşturuyordu.
 *  - Yetkisiz erişim ve yükleniyor durumları ortak `EmptyState` / `SpinnerLoading`
 *    primitive'lerine taşındı.
 */

"use client";

import AdminSidebar from "@/components/admin/AdminSidebar";
import { Toaster } from "react-hot-toast";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { SessionProvider } from "next-auth/react";
import { SpinnerLoading } from "@/components/ui/LoadingSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";

/**
 * Korumalı yönetici sayfalarının layout bileşeni.
 * @param {object} props - Bileşen propları.
 * @param {React.ReactNode} props.children - Sarmalanacak alt bileşenler (sayfa içeriği).
 */
function ProtectedAdminLayoutInner({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
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

    checkMobile();

    let timeoutId: ReturnType<typeof setTimeout>;
    const debouncedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(checkMobile, 150);
    };

    const handleOrientationChange = () => setTimeout(checkMobile, 200);

    window.addEventListener('resize', debouncedResize);
    window.addEventListener('orientationchange', handleOrientationChange);
    return () => {
      window.removeEventListener('resize', debouncedResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
      clearTimeout(timeoutId);
    };
  }, [isMobileMenuOpen]);

  // Auth kontrolü
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/giris');
      return;
    }
    if (session.user?.role !== 'admin') {
      router.push('/giris');
      return;
    }
  }, [session, status, router]);

  // Handle mobile menu close when clicking outside or navigation
  const handleMobileMenuClose = () => {
    if (isMobile) setIsMobileMenuOpen(false);
  };

  // Yükleniyor durumu
  if (status === 'loading') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <SpinnerLoading text="Yönetim paneli yükleniyor..." />
      </div>
    );
  }

  // Yetkisiz erişim
  if (!session || session.user?.role !== 'admin') {
    return (
      <EmptyState
        variant="page"
        icon="question"
        title="Yetkisiz erişim"
        description="Bu sayfa yalnızca yönetici yetkisi verilen hesaplara açıktır. Yetkiniz varsa çıkış yapıp kendi hesabınızla tekrar giriş yapın."
        action={{ label: 'Giriş Yap', href: '/giris' }}
        secondaryAction={{ label: 'Ana Sayfa', href: '/' }}
      />
    );
  }

  return (
    <div className="flex min-h-screen bg-muted text-foreground relative">
      <Toaster
        position="top-right"
        toastOptions={{
          className: 'text-sm sm:text-base',
          style: { marginTop: isMobile ? '80px' : '20px' },
        }}
      />

      <AdminSidebar
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      {/*
        Kök layout'ta zaten <main id="main-content"> var; burada <div>
        kullanılır. Böylece dokümanda tek bir main landmark kalır.
      */}
      <div
        className={`
          flex-1 w-full lg:w-auto min-w-0
          transition-opacity duration-300 ease-out
          ${isMobile ? 'pt-16 sm:pt-18 md:pt-20' : 'pt-0'}
          px-2 xs:px-3 sm:px-4 md:px-6 lg:px-8
          py-3 xs:py-4 sm:py-5 md:py-6 lg:py-8
          overflow-x-hidden
          ${isMobileMenuOpen && isMobile ? 'pointer-events-none opacity-50' : ''}
          relative
        `}
        onClick={handleMobileMenuClose}
        style={{ minHeight: isMobile ? 'calc(100vh - 4rem)' : 'auto' }}
      >
        <div className="mx-auto max-w-7xl w-full min-w-0">
          <div className="admin-content-spacing">{children}</div>
        </div>
      </div>
    </div>
  );
}

export default function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <ProtectedAdminLayoutInner>{children}</ProtectedAdminLayoutInner>
    </SessionProvider>
  );
}
