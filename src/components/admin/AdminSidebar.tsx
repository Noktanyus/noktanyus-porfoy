/**
 * @file Yönetim panelindeki tüm sayfalara navigasyon sağlayan kenar çubuğu (sidebar) bileşeni.
 * @description Bu bileşen, yönetim panelindeki ana bölümlere linkler sunar,
 *              aktif sayfayı vurgular ve güvenli çıkış işlemi için bir buton içerir.
 */

"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import toast from "react-hot-toast";
import { 
  FaTachometerAlt, FaUserEdit, FaProjectDiagram, FaBroadcastTower, 
  FaBlog, FaEnvelopeOpenText, FaCog, FaSignOutAlt, 
  FaEye, FaHome, FaHistory, FaImages
} from "react-icons/fa";

const AdminSidebar = () => {
  const pathname = usePathname();

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

  /**
   * Kullanıcıya onay sorduktan sonra oturumu sonlandırır ve ana sayfaya yönlendirir.
   */
  const handleSignOut = () => {
    if (window.confirm("Yönetim panelinden çıkmak istediğinize emin misiniz?")) {
      toast.success("Başarıyla çıkış yapıldı. Yönlendiriliyorsunuz...");
      signOut({ callbackUrl: "/" }); // Çıkış sonrası ana sayfaya yönlendir
    }
  };

  return (
    <aside className="w-64 bg-white dark:bg-dark-card text-light-text dark:text-dark-text flex flex-col shadow-lg">
      <div className="p-6 text-2xl font-bold border-b border-gray-200 dark:border-dark-border">
        <Link href="/admin/dashboard">Yönetim Paneli</Link>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navLinks.map((link) => {
          // Aktif linki belirlemek için mevcut yolu (pathname) kontrol et.
          // Gösterge paneli için tam eşleşme, diğerleri için başlangıç eşleşmesi kullanılır.
          const isActive = link.href === "/admin/dashboard" 
            ? pathname === link.href 
            : pathname.startsWith(link.href);

          return (
            <Link href={link.href} key={link.href}>
              <div
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? "bg-brand-primary text-white font-semibold shadow-md" // Aktif link stili
                    : "hover:bg-gray-200 dark:hover:bg-gray-700" // Hover stili
                }`}
              >
                <span className="text-xl">{link.icon}</span>
                <span>{link.text}</span>
              </div>
            </Link>
          );
        })}
      </nav>
      {/* Alt Kısım: Siteyi Görüntüle ve Çıkış Butonları */}
      <div className="px-4 py-6 border-t border-gray-200 dark:border-dark-border space-y-2">
        <a href="/" target="_blank" rel="noopener noreferrer" className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            <span className="text-xl"><FaEye /></span>
            <span>Siteyi Görüntüle</span>
        </a>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left text-red-600 dark:text-red-500 hover:bg-red-500 hover:text-white dark:hover:bg-red-600 transition-colors"
        >
          <span className="text-xl"><FaSignOutAlt /></span>
          <span>Güvenli Çıkış</span>
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
