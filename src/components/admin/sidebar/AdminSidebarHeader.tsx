'use client';

import Link from 'next/link';
import { FaTimes } from 'react-icons/fa';

interface AdminSidebarHeaderProps {
  onClose?: () => void;
}

/**
 * Admin sidebar'in ust kismi: marka linki + mobil kapat butonu.
 * 80px min-h ile stabil layout saglar.
 */
export function AdminSidebarHeader({ onClose }: AdminSidebarHeaderProps) {
  return (
    <div className="p-6 border-b border-border flex items-center justify-between flex-shrink-0 min-h-[80px] bg-gradient-to-r from-primary to-primary/80">
      <Link
        href="/admin/dashboard"
        onClick={onClose}
        className="text-xl font-bold text-primary-foreground hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-primary rounded-lg px-2 py-1 touch-manipulation truncate flex-1 min-w-0 mr-2"
      >
        Admin Panel
      </Link>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Menüyü kapat"
          className="lg:hidden min-w-[48px] min-h-[48px] w-12 h-12 flex items-center justify-center rounded-xl hover:bg-primary-foreground/20 active:bg-primary-foreground/30 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-primary touch-manipulation flex-shrink-0"
        >
          <FaTimes className="w-5 h-5 text-primary-foreground" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
