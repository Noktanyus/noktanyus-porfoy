'use client';

/**
 * Dashboard Sidebar — kullanıcı dashboard'u için yan navigasyon.
 * Üst kısımda NotificationBell ile bildirim çanı yer alır.
 *
 * Nav item'lar 44px touch target, focus-visible halka, hover/active
 * durumlarinda `bg-muted` veya `bg-primary/10` tint'i ile belirgin.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FaSatelliteDish,
  FaBell,
  FaChartLine,
  FaChartBar,
  FaUserCog,
  FaArrowLeft,
  FaCreditCard,
  FaBox,
  FaBoxOpen,
  FaShoppingCart,
  FaStore,
  FaTasks,
  FaGift,
  FaKey,
} from 'react-icons/fa';
import type { IconType } from 'react-icons';
import { NotificationBell } from '@/components/dashboard/NotificationBell';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: IconType;
  exact?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Genel Bakış', icon: FaChartLine, exact: true },
  { href: '/dashboard/monitors', label: 'Monitörler', icon: FaSatelliteDish },
  { href: '/dashboard/alert-channels', label: 'Alert Kanalları', icon: FaBell },
  { href: '/dashboard/orders', label: 'Siparişler', icon: FaShoppingCart },
  { href: '/dashboard/products', label: 'Ürünlerim', icon: FaBox },
  { href: '/dashboard/templates', label: 'Template Lisanslarım', icon: FaKey },
  { href: '/dashboard/bundles', label: 'Bundle Ürünler', icon: FaBoxOpen },
  { href: '/dashboard/vendor', label: 'Vendor Mağaza', icon: FaStore },
  { href: '/dashboard/tasks', label: 'Görevler', icon: FaTasks },
  { href: '/dashboard/reports', label: 'Raporlar', icon: FaChartBar },
  { href: '/dashboard/affiliate', label: 'Affiliate', icon: FaGift },
  { href: '/dashboard/loyalty', label: 'Sadakat', icon: FaCreditCard },
  { href: '/dashboard/billing', label: 'Faturalandırma', icon: FaCreditCard },
  { href: '/dashboard/settings', label: 'Ayarlar', icon: FaUserCog },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        'w-full lg:w-64 p-5 lg:sticky lg:top-24 self-start',
        'bg-card text-card-foreground border border-border rounded-2xl shadow-sm',
      )}
      aria-label="Dashboard gezinme menüsü"
    >
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
        >
          <FaArrowLeft className="w-3 h-3" aria-hidden="true" />
          Siteye Dön
        </Link>
        <NotificationBell />
      </div>
      <h2 className="text-lg font-semibold mb-4">Dashboard</h2>
      <nav aria-label="Dashboard" className="space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm min-h-[44px] transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card',
                isActive
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <Icon className="w-4 h-4" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
