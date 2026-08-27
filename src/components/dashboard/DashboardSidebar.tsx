'use client';

/**
 * Dashboard Sidebar — kullanıcı dashboard'u için yan navigasyon.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FaSatelliteDish,
  FaBell,
  FaChartLine,
  FaUserCog,
  FaArrowLeft,
  FaCreditCard,
  FaBox,
  FaShoppingCart,
} from 'react-icons/fa';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Genel Bakış', icon: FaChartLine, exact: true },
  { href: '/dashboard/monitors', label: 'Monitörler', icon: FaSatelliteDish },
  { href: '/dashboard/alert-channels', label: 'Alert Kanalları', icon: FaBell },
  { href: '/dashboard/orders', label: 'Siparişler', icon: FaShoppingCart },
  { href: '/dashboard/products', label: 'Ürünlerim', icon: FaBox },
  { href: '/dashboard/billing', label: 'Faturalandırma', icon: FaCreditCard },
  { href: '/dashboard/settings', label: 'Ayarlar', icon: FaUserCog },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="glass-card-premium w-full lg:w-64 p-5 lg:sticky lg:top-24 self-start">
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <FaArrowLeft className="w-3 h-3" />
          Siteye Dön
        </Link>
      </div>
      <h2 className="text-lg font-semibold mb-4">Dashboard</h2>
      <nav className="space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-brand-primary/10 text-brand-primary font-medium'
                  : 'hover:bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
