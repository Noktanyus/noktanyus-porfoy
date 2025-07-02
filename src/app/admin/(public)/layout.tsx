/**
 * @file Halka açık yönetici sayfaları için layout.
 * @description Bu layout, kimlik doğrulaması gerektirmeyen yönetici sayfalarını
 *              (sadece giriş sayfası gibi) sarmalar. Bu layout, kenar çubuğu
 *              veya diğer korumalı alan bileşenlerini içermez, sadece sayfa
 *              içeriğini ortalar ve bildirimler için `Toaster` bileşenini ekler.
 */

import { Toaster } from "react-hot-toast";

/**
 * Halka açık yönetici sayfalarının layout bileşeni.
 * @param {object} props - Bileşen propları.
 * @param {React.ReactNode} props.children - Sarmalanacak alt bileşenler (sayfa içeriği).
 */
export default function PublicAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Sayfa içeriğini dikey ve yatayda ortalamak için flexbox kullanır.
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-dark-bg">
      {/* Bildirim (toast) mesajlarının gösterileceği alan. */}
      <Toaster position="top-right" />
      {/* Sayfanın asıl içeriği (örn: Login formu) burada render edilir. */}
      {children}
    </div>
  );
}
