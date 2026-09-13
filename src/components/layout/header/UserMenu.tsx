'use client';

/**
 * @file UserMenu - Header'daki kullanici dropdown menüsü.
 *
 * 44px touch target + ESC kapatma + dis click kapatma + role="menu".
 * Admin kullanıcılarda "Yönetim" (/admin) linki gösterilir.
 */

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import {
  FaUserCircle,
  FaSignOutAlt,
  FaCog,
  FaTachometerAlt,
  FaShieldAlt,
} from 'react-icons/fa';
import { Tooltip } from '@/components/ui/Tooltip';

export function UserMenu() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isAdmin = session?.user?.role === 'admin';

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('keydown', handleKey);
    document.addEventListener('mousedown', handleClick);
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.removeEventListener('mousedown', handleClick);
    };
  }, [open]);

  if (!session?.user) {
    return (
      <Link
        href="/giris"
        className="hidden md:inline-flex items-center text-sm lg:text-base text-slate-700 dark:text-slate-300 whitespace-nowrap py-2 px-2 lg:px-3 rounded-lg min-h-[44px] hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
      >
        Giriş Yap
      </Link>
    );
  }

  const itemClass =
    'flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-slate-700 dark:text-slate-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 min-h-[44px]';

  return (
    <div className="relative" ref={containerRef}>
      <Tooltip content="Hesap menüsü" side="bottom">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Hesap menüsü"
          aria-expanded={open}
          aria-haspopup="menu"
          className="touch-target rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 p-1"
        >
          <FaUserCircle className="w-5 h-5 text-slate-700 dark:text-slate-300" aria-hidden="true" />
        </button>
      </Tooltip>
      {open && (
        <div
          role="menu"
          aria-label="Hesap menüsü"
          className="absolute right-0 mt-2 w-56 rounded-xl bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-700 shadow-xl backdrop-blur-md p-2 z-40 fade-in"
        >
          <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-700 mb-1">
            <p className="text-sm font-semibold truncate text-slate-900 dark:text-white">
              {session.user.name || 'Kullanıcı'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {session.user.email}
            </p>
            {isAdmin && (
              <span className="mt-1.5 inline-flex items-center rounded-full bg-indigo-100 dark:bg-indigo-950/50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">
                Admin
              </span>
            )}
          </div>
          <Link
            href="/dashboard"
            onClick={() => setOpen(false)}
            role="menuitem"
            className={itemClass}
          >
            <FaTachometerAlt className="w-4 h-4 shrink-0" aria-hidden="true" />
            Hesabım
          </Link>
          <Link
            href="/dashboard/settings"
            onClick={() => setOpen(false)}
            role="menuitem"
            className={itemClass}
          >
            <FaCog className="w-4 h-4 shrink-0" aria-hidden="true" />
            Ayarlar
          </Link>
          {isAdmin && (
            <>
              <div
                className="my-1 border-t border-slate-200 dark:border-slate-700"
                role="separator"
              />
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                role="menuitem"
                className={`${itemClass} font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100/80 dark:hover:bg-indigo-950/50`}
              >
                <FaShieldAlt className="w-4 h-4 shrink-0" aria-hidden="true" />
                Yönetim
              </Link>
            </>
          )}
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              signOut({ callbackUrl: '/' });
            }}
            role="menuitem"
            className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 min-h-[44px]"
          >
            <FaSignOutAlt className="w-4 h-4 shrink-0" aria-hidden="true" />
            Çıkış Yap
          </button>
        </div>
      )}
    </div>
  );
}
