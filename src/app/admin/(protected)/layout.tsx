/**
 * @file Korumalı yönetici sayfaları için ana layout.
 * @description Bu layout, kimlik doğrulaması gerektiren tüm yönetici sayfalarını
 *              (örn: /admin/dashboard, /admin/projects) sarmalar. Sayfalara
 *              `AdminSidebar` ve bildirimler için `Toaster` bileşenlerini ekler.
 */

export const dynamic = 'force-dynamic';

import AdminSidebar from "@/components/admin/AdminSidebar";
import { Toaster } from "react-hot-toast";

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
  return (
    // Ana kapsayıcı, sidebar ve ana içeriği yan yana dizer.
    <div className="flex min-h-screen bg-gray-100 dark:bg-dark-bg text-light-text dark:text-dark-text">
      {/* Bildirim (toast) mesajlarının gösterileceği alan. */}
      <Toaster position="top-right" />
      
      {/* Sol taraftaki navigasyon menüsü. */}
      <AdminSidebar />
      
      {/* Ana içerik alanı. */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">
          {/* Sayfanın asıl içeriği burada render edilir. */}
          {children}
        </div>
      </main>
    </div>
  );
}
