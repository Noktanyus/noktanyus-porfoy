/**
 * @file adminNavLinks — Admin panel navigasyonunun TEK kaynağı.
 *
 * Daha önce link listesi `AdminSidebar` içinde tanımlanıyor, `MobileBreadcrumb`
 * ise aynı listenin ikon'suz bir kopyasını prop olarak alıyordu. Aktif link
 * hesabı da iki yerde ayrı ayrı yazılmıştı ve iki farklı hata üretiyordu:
 *
 *  1. `pathname.startsWith(href)` alt sayfalarda BİRDEN FAZLA linki aktif
 *     gösteriyordu (`/admin/blog/scheduled` hem "Blog Yönetimi" hem
 *     "Taslaklar" için eşleşiyordu).
 *  2. `/admin/newsletter/broadcast` altındayken "Newsletter" de aktif oluyordu.
 *
 * Çözüm: `resolveActiveHref` EN UZUN segment eşleşmesini seçer, böylece her
 * zaman tek bir aktif link olur.
 */

import type { ReactNode } from 'react';
import {
  FaTachometerAlt, FaUserEdit, FaProjectDiagram, FaBroadcastTower,
  FaBlog, FaEnvelopeOpenText, FaCog, FaHome, FaHistory, FaImages,
  FaShieldAlt, FaStore, FaTags, FaUsersCog, FaNewspaper, FaChartLine,
  FaFlask, FaPalette, FaCalendarAlt, FaBullhorn, FaSwatchbook, FaLayerGroup, FaCreditCard,
} from 'react-icons/fa';

export interface AdminNavLink {
  href: string;
  text: string;
  icon: ReactNode;
}

export const ADMIN_NAV_LINKS: AdminNavLink[] = [
  { href: '/admin/dashboard', text: 'Gösterge Paneli', icon: <FaTachometerAlt /> },
  { href: '/admin/analytics', text: 'Analytics', icon: <FaChartLine /> },
  { href: '/admin/home-settings', text: 'Ana Sayfa Ayarları', icon: <FaHome /> },
  { href: '/admin/hakkimda', text: 'Hakkımda Sayfası', icon: <FaUserEdit /> },
  { href: '/admin/projects', text: 'Proje Yönetimi', icon: <FaProjectDiagram /> },
  { href: '/admin/products', text: 'Ürün Yönetimi', icon: <FaStore /> },
  { href: '/admin/plans', text: 'Abonelik Planları', icon: <FaCreditCard /> },
  { href: '/admin/categories', text: 'Kategoriler', icon: <FaLayerGroup /> },
  { href: '/admin/templates', text: 'Template Yönetimi', icon: <FaPalette /> },
  { href: '/admin/coupons', text: 'Kuponlar', icon: <FaTags /> },
  { href: '/admin/workspaces', text: "Workspace'ler", icon: <FaUsersCog /> },
  { href: '/admin/popups', text: 'Popup Yönetimi', icon: <FaBroadcastTower /> },
  { href: '/admin/gallery', text: 'Galeri', icon: <FaImages /> },
  { href: '/admin/blog', text: 'Blog Yönetimi', icon: <FaBlog /> },
  { href: '/admin/blog/scheduled', text: 'Taslaklar & Zamanlanmış', icon: <FaCalendarAlt /> },
  { href: '/admin/newsletter', text: 'Newsletter', icon: <FaNewspaper /> },
  { href: '/admin/newsletter/broadcast', text: 'Broadcast', icon: <FaBroadcastTower /> },
  { href: '/admin/campaigns', text: 'Email Kampanyaları', icon: <FaBullhorn /> },
  { href: '/admin/messages', text: 'Gelen Mesajlar', icon: <FaEnvelopeOpenText /> },
  { href: '/admin/themes', text: 'Tema Yönetimi', icon: <FaSwatchbook /> },
  { href: '/admin/seo', text: 'SEO Ayarları', icon: <FaCog /> },
  { href: '/admin/history', text: 'Değişiklik Geçmişi', icon: <FaHistory /> },
  { href: '/admin/audit', text: 'Denetim Kayıtları', icon: <FaShieldAlt /> },
  { href: '/admin/settings/sandbox', text: 'Sandbox Environment', icon: <FaFlask /> },
];

/**
 * Verilen pathname icin aktif olan tek nav href'ini döner.
 *
 * Kural: pathname ile segment bazında eşleşen linkler arasından EN UZUN
 * olanı kazanır. Segment bazlı karşılaştırma yapılır, böylece
 * `/admin/blogxyz` `/admin/blog` ile eşleşmez.
 *
 * @example
 * resolveActiveHref('/admin/blog')            // '/admin/blog'
 * resolveActiveHref('/admin/blog/scheduled')  // '/admin/blog/scheduled'
 * resolveActiveHref('/admin/blog/edit/abc')   // '/admin/blog'
 * resolveActiveHref('/admin/bilinmeyen')      // null
 */
export function resolveActiveHref(
  pathname: string | null | undefined,
  links: readonly { href: string }[] = ADMIN_NAV_LINKS,
): string | null {
  if (!pathname) return null;

  let best: string | null = null;
  for (const link of links) {
    if (pathname === link.href) return link.href;
    // Segment sınırı kontrolü: '/admin/blog/' prefix'i olmalı
    if (pathname.startsWith(`${link.href}/`)) {
      if (best === null || link.href.length > best.length) {
        best = link.href;
      }
    }
  }
  return best;
}
