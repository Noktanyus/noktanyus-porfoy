"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import toast from "react-hot-toast";
import { 
  FaTachometerAlt, FaUserEdit, FaProjectDiagram, FaBroadcastTower, 
  FaBlog, FaEnvelopeOpenText, FaCog, FaSignOutAlt, 
  FaEye, FaHome, FaHistory 
} from "react-icons/fa";

/**
 * Yönetim panelindeki tüm sayfalara navigasyon sağlayan kenar çubuğu (sidebar) bileşeni.
 */
const AdminSidebar = () => {
  const pathname = usePathname();

  // Kenar çubuğunda gösterilecek navigasyon linkleri
  const navLinks = [
    { href: "/admin/dashboard", text: "Gösterge Paneli", icon: <FaTachometerAlt /> },
    { href: "/admin/home-settings", text: "Ana Sayfa Ayarları", icon: <FaHome /> },
    { href: "/admin/hakkimda", text: "Hakkımda Sayfası", icon: <FaUserEdit /> },
    { href: "/admin/projects", text: "Proje Yönetimi", icon: <FaProjectDiagram /> },
    { href: "/admin/popups", text: "Popup Yönetimi", icon: <FaBroadcastTower /> },
    { href: "/admin/blog", text: "Blog Yönetimi", icon: <FaBlog /> },
    { href: "/admin/messages", text: "Gelen Mesajlar", icon: <FaEnvelopeOpenText /> },
    { href: "/admin/seo", text: "SEO Ayarları", icon: <FaCog /> },
    { href: "/admin/history", text: "Değişiklik Geçmişi", icon: <FaHistory /> },
  ];

  /**
   * Kullanıcıya onay sorduktan sonra çıkış işlemini gerçekleştirir.
   */
  const handleSignOut = () => {
    if (window.confirm("Yönetim panelinden çıkmak istediğinize emin misiniz?")) {
      toast.success("Başarıyla çıkış yapıldı.");
      signOut({ callbackUrl: "/" });
    }
  };

  return (
    <aside className="w-64 bg-white dark:bg-dark-card text-light-text dark:text-dark-text flex flex-col shadow-lg">
      <div className="p-6 text-2xl font-bold border-b border-gray-200 dark:border-dark-border">
        <Link href="/admin/dashboard">Yönetim Paneli</Link>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navLinks.map((link) => {
          // Aktif linki belirlemek için mevcut yolu (pathname) kontrol et
          const isActive = link.href === "/admin/dashboard" 
            ? pathname === link.href 
            : pathname.startsWith(link.href);

          return (
            <Link href={link.href} key={link.href}>
              <div
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? "bg-brand-primary text-white font-semibold"
                    : "hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                <span className="text-xl">{link.icon}</span>
                <span>{link.text}</span>
              </div>
            </Link>
          );
        })}
      </nav>
      <div className="px-4 py-6 border-t border-gray-200 dark:border-dark-border space-y-2">
        <Link href="/" target="_blank" rel="noopener noreferrer">
            <div className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700">
                <span className="text-xl"><FaEye /></span>
                <span>Siteyi Görüntüle</span>
            </div>
        </Link>
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
