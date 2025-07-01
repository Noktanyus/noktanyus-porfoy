"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaTachometerAlt, FaUserEdit, FaProjectDiagram, FaBroadcastTower, FaBlog, FaEnvelopeOpenText, FaCog, FaSignOutAlt, FaEye, FaHome } from "react-icons/fa";
// ... (diğer importlar)

const navLinks = [
  { href: "/admin/dashboard", text: "Dashboard", icon: <FaTachometerAlt /> },
  { href: "/admin/home-settings", text: "Ana Sayfa", icon: <FaHome /> },
  { href: "/admin/hakkimda", text: "Hakkımda", icon: <FaUserEdit /> },
  { href: "/admin/projects", text: "Projelerim", icon: <FaProjectDiagram /> },
  { href: "/admin/popups", text: "Popuplar", icon: <FaBroadcastTower /> },
  { href: "/admin/blog", text: "Blog", icon: <FaBlog /> },
  { href: "/admin/messages", text: "Mesajlar", icon: <FaEnvelopeOpenText /> },
  { href: "/admin/seo", text: "SEO", icon: <FaCog /> },
];

const AdminSidebar = () => {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white dark:bg-dark-card text-light-text dark:text-dark-text flex flex-col shadow-lg">
      <div className="p-6 text-2xl font-bold border-b border-gray-200 dark:border-dark-border">
        <Link href="/admin/dashboard">Yönetim Paneli</Link>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navLinks.map((link) => (
          <Link href={link.href} key={link.href}>
            <div
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                pathname.startsWith(link.href) && (link.href !== "/admin/dashboard" || pathname === "/admin/dashboard")
                  ? "bg-brand-primary text-white"
                  : "hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              <span className="text-xl">{link.icon}</span>
              <span>{link.text}</span>
            </div>
          </Link>
        ))}
      </nav>
      <div className="px-4 py-6 border-t border-gray-200 dark:border-dark-border space-y-2">
        <Link href="/" target="_blank">
            <div className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700">
                <span className="text-xl"><FaEye /></span>
                <span>Siteyi Görüntüle</span>
            </div>
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left hover:bg-red-500 hover:text-white transition-colors"
        >
          <span className="text-xl"><FaSignOutAlt /></span>
          <span>Çıkış Yap</span>
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;