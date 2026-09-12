'use client';

/**
 * @file SaasAppNav — /saas/(app) yan navigasyonu.
 *
 * Faz D: emoji ikonlar react-icons'e taşındı. Emoji'ler ekran okuyucularda
 * tutarsız okunuyordu ve platformlar arası görsel farklılık yaratıyordu.
 *
 * - Aktif link `usePathname` ile belirlenir (`aria-current="page"`)
 * - Mobilde yatay kaydırılabilir şerit, lg+ dikey liste
 * - Her hedef min 44px (WCAG 2.5.8)
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import {
  FaChartBar,
  FaMagic,
  FaPalette,
  FaLayerGroup,
  FaGem,
} from 'react-icons/fa';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
  /** Tam eşleşme mi, prefix eşleşmesi mi */
  exact?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/saas/dashboard', label: 'Dashboard', icon: <FaChartBar />, exact: true },
  { href: '/saas/generate', label: 'Üret', icon: <FaMagic /> },
  { href: '/saas/brand-voice', label: 'Marka Sesi', icon: <FaPalette /> },
  { href: '/saas/jobs', label: 'Toplu İşler', icon: <FaLayerGroup /> },
];

export function SaasAppNav() {
  const pathname = usePathname();

  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  return (
    <nav
      aria-label="SaaS menü"
      className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible no-scrollbar"
    >
      {NAV_ITEMS.map((item) => {
        const active = isActive(item);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'inline-flex items-center gap-2.5 shrink-0 min-h-[44px] px-3 rounded-lg',
              'text-sm font-medium transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              active
                ? 'bg-brand-primary/10 text-brand-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <span aria-hidden="true" className="text-base shrink-0">
              {item.icon}
            </span>
            <span className="whitespace-nowrap">{item.label}</span>
          </Link>
        );
      })}

      <Link
        href="/saas#pricing"
        className={cn(
          'inline-flex items-center gap-2.5 shrink-0 min-h-[44px] px-3 rounded-lg',
          'text-sm font-medium text-muted-foreground transition-colors',
          'hover:bg-muted hover:text-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'lg:mt-2 lg:border-t lg:border-border/60 lg:pt-4 lg:rounded-none',
        )}
      >
        <span aria-hidden="true" className="text-base shrink-0">
          <FaGem />
        </span>
        <span className="whitespace-nowrap">Planı Yükselt</span>
      </Link>
    </nav>
  );
}

export default SaasAppNav;
