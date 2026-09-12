'use client';

import { FaBars, FaTimes } from 'react-icons/fa';

interface HamburgerButtonProps {
  open: boolean;
  disabled?: boolean;
  onToggle: () => void;
}

/**
 * Admin sidebar'ı mobilde acmak icin hamburger butonu.
 * - 48x48 touch target (WCAG 2.5.8 uyumlu)
 * - aria-expanded + aria-controls
 * - disabled state animasyon sirasinda
 */
export function HamburgerButton({ open, disabled, onToggle }: HamburgerButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={open ? 'Menüyü kapat' : 'Menüyü aç'}
      aria-expanded={open}
      aria-controls="admin-sidebar"
      disabled={disabled}
      className="lg:hidden fixed top-3 left-3 z-50 min-w-[48px] min-h-[48px] w-12 h-12 flex items-center justify-center rounded-xl bg-card shadow-lg border border-border hover:bg-muted hover:shadow-xl transition-all duration-200 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <div className="relative w-6 h-6 flex items-center justify-center">
        <div
          className={`absolute inset-0 transition-all duration-300 ${open ? 'rotate-180 opacity-0' : 'rotate-0 opacity-100'}`}
        >
          <FaBars className="w-5 h-5 text-foreground" aria-hidden="true" />
        </div>
        <div
          className={`absolute inset-0 transition-all duration-300 ${open ? 'rotate-0 opacity-100' : 'rotate-180 opacity-0'}`}
        >
          <FaTimes className="w-5 h-5 text-foreground" aria-hidden="true" />
        </div>
      </div>
    </button>
  );
}
