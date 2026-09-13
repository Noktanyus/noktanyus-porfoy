/**
 * @file adminNavLinks — Admin panel navigasyonunun TEK kaynağı.
 *
 * Satış + içerik odaklı sade menü. ResolveActiveHref en uzun eşleşmeyi seçer.
 */

import type { ReactNode } from 'react';
import {
  FaTachometerAlt, FaUserEdit, FaProjectDiagram,
  FaBlog, FaEnvelopeOpenText, FaCog, FaHome,
  FaStore, FaLayerGroup, FaCreditCard, FaTags,
} from 'react-icons/fa';

export interface AdminNavLink {
  href: string;
  text: string;
  icon: ReactNode;
}

export const ADMIN_NAV_LINKS: AdminNavLink[] = [
  { href: '/admin/dashboard', text: 'Gösterge Paneli', icon: <FaTachometerAlt /> },
  { href: '/admin/products', text: 'Ürünler', icon: <FaStore /> },
  { href: '/admin/plans', text: 'Abonelik Planları', icon: <FaCreditCard /> },
  { href: '/admin/categories', text: 'Kategoriler', icon: <FaLayerGroup /> },
  { href: '/admin/coupons', text: 'Kuponlar', icon: <FaTags /> },
  { href: '/admin/projects', text: 'Projeler', icon: <FaProjectDiagram /> },
  { href: '/admin/blog', text: 'Blog', icon: <FaBlog /> },
  { href: '/admin/hakkimda', text: 'Hakkımda', icon: <FaUserEdit /> },
  { href: '/admin/home-settings', text: 'Ana Sayfa', icon: <FaHome /> },
  { href: '/admin/messages', text: 'Mesajlar', icon: <FaEnvelopeOpenText /> },
  { href: '/admin/seo', text: 'SEO', icon: <FaCog /> },
];

/**
 * Verilen pathname icin aktif olan tek nav href'ini döner.
 */
export function resolveActiveHref(
  pathname: string | null | undefined,
  links: readonly { href: string }[] = ADMIN_NAV_LINKS,
): string | null {
  if (!pathname) return null;

  let best: string | null = null;
  for (const link of links) {
    if (pathname === link.href) return link.href;
    if (pathname.startsWith(`${link.href}/`)) {
      if (best === null || link.href.length > best.length) {
        best = link.href;
      }
    }
  }
  return best;
}
