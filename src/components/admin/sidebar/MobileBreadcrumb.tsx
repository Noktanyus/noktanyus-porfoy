'use client';

import { usePathname } from 'next/navigation';
import { ADMIN_NAV_LINKS, resolveActiveHref } from './adminNavLinks';

interface MobileBreadcrumbProps {
  /** Header'da "Yönetim Paneli" gibi fallback baslik. */
  fallback?: string;
}

/**
 * Mobilde sag ustte aktif sayfanin basligini gosteren pill.
 *
 * Aktif sayfa `resolveActiveHref` ile bulunur — sidebar ile AYNI mantık,
 * böylece pill'de gösterilen başlık sidebar'da vurgulanan linkle her zaman
 * aynı olur (önceden ikisi ayrı hesaplanıyordu ve alt sayfalarda
 * uyuşmuyordu).
 */
export function MobileBreadcrumb({ fallback = 'Yönetim Paneli' }: MobileBreadcrumbProps) {
  const pathname = usePathname();
  const activeHref = resolveActiveHref(pathname);
  const active = ADMIN_NAV_LINKS.find((link) => link.href === activeHref);

  return (
    <div className="lg:hidden fixed top-3 right-3 z-40 pointer-events-none">
      <div className="bg-card/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-sm border border-border/50">
        <span className="text-xs font-medium text-muted-foreground">
          {active?.text ?? fallback}
        </span>
      </div>
    </div>
  );
}
