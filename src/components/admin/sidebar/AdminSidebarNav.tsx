'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ADMIN_NAV_LINKS, resolveActiveHref, type AdminNavLink } from './adminNavLinks';

interface AdminSidebarNavProps {
  /** Varsayilan: ADMIN_NAV_LINKS (tek kaynak). Test icin override edilebilir. */
  links?: AdminNavLink[];
  onNavigate?: () => void;
}

/**
 * Admin sidebar navigasyon listesi.
 *
 * Aktif link `resolveActiveHref` ile belirlenir — en uzun segment eşleşmesi
 * kazanır, böylece alt sayfalarda yalnızca TEK link aktif görünür.
 *
 * a11y: `<ul>/<li>` gerçek liste semantiği kullanılır (önceki sürümde
 * `role="list"` bir <nav> üzerinde, `role="listitem"` ise <a> üzerinde
 * tanımlıydı; bu geçersiz bir yapıydı). Aktif link `aria-current="page"`
 * ile işaretlenir.
 */
export function AdminSidebarNav({ links = ADMIN_NAV_LINKS, onNavigate }: AdminSidebarNavProps) {
  const pathname = usePathname();
  const activeHref = resolveActiveHref(pathname, links);

  return (
    <nav
      className="flex-1 px-4 py-6 overflow-y-auto overflow-x-hidden min-h-0"
      aria-label="Yönetim paneli bölümleri"
    >
      <ul className="space-y-2">
        {links.map((link) => {
          const isActive = link.href === activeHref;

          return (
            <li key={link.href}>
              <Link
                href={link.href}
                onClick={onNavigate}
                aria-current={isActive ? 'page' : undefined}
                className={`flex items-center space-x-4 px-4 py-3 min-h-[52px] rounded-xl transition-all duration-300 ease-out touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 group relative overflow-hidden ${
                  isActive
                    ? 'bg-primary text-primary-foreground font-semibold shadow-lg'
                    : 'hover:bg-muted active:bg-muted/80 text-foreground'
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`text-xl flex-shrink-0 min-w-[24px] flex items-center justify-center transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}
                >
                  {link.icon}
                </span>
                <span className="text-sm font-medium truncate flex-1 min-w-0 leading-tight">
                  {link.text}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
