/**
 * @file Yönetim paneli için responsive client layout kabuğu.
 * @description AdminSidebar, Toaster ve mobil menü davranışını (açma/kapama,
 *              arka plan tıklaması, responsive padding) yönetir.
 *              Auth kontrolü sunucu tarafında (Server Component layout)
 *              yapıldığı için bu bileşende oturum kontrolü veya SessionProvider
 *              bulunmaz; sıfır gecikmeyle render edilir.
 */

"use client";

import AdminSidebar from "@/components/admin/AdminSidebar";
import { Toaster } from "react-hot-toast";
import { useState, useEffect } from "react";

export function AdminLayoutClient({
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

    checkMobile();

    let timeoutId: ReturnType<typeof setTimeout>;
    const debouncedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(checkMobile, 150);
    };

    const handleOrientationChange = () => setTimeout(checkMobile, 200);

    window.addEventListener("resize", debouncedResize);
    window.addEventListener("orientationchange", handleOrientationChange);
    return () => {
      window.removeEventListener("resize", debouncedResize);
      window.removeEventListener("orientationchange", handleOrientationChange);
      clearTimeout(timeoutId);
    };
  }, [isMobileMenuOpen]);

  // Handle mobile menu close when clicking outside or navigation
  const handleMobileMenuClose = () => {
    if (isMobile) setIsMobileMenuOpen(false);
  };

  return (
    <div className="flex min-h-screen bg-muted text-foreground relative">
      <Toaster
        position="top-right"
        toastOptions={{
          className: "text-sm sm:text-base",
          style: { marginTop: isMobile ? "80px" : "20px" },
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
          ${isMobile ? "pt-16 sm:pt-18 md:pt-20" : "pt-0"}
          px-2 xs:px-3 sm:px-4 md:px-6 lg:px-8
          py-3 xs:py-4 sm:py-5 md:py-6 lg:py-8
          overflow-x-hidden
          ${isMobileMenuOpen && isMobile ? "pointer-events-none opacity-50" : ""}
          relative
        `}
        onClick={handleMobileMenuClose}
        style={{ minHeight: isMobile ? "calc(100vh - 4rem)" : "auto" }}
      >
        <div className="mx-auto max-w-7xl w-full min-w-0">
          <div className="admin-content-spacing">{children}</div>
        </div>
      </div>
    </div>
  );
}
