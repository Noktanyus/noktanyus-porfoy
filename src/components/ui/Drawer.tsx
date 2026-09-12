'use client';

/**
 * @file Drawer - Mobile responsive drawer/sidebar component.
 *
 * Mobile responsive ozellikler:
 * - slide-in animasyon
 * - body scroll lock (body-scroll-lock class)
 * - ESC ile kapatma
 * - backdrop click ile kapatma
 * - 44px touch targets
 * - focus trap (Tab/Shift+Tab drawer icinde)
 * - aria-modal
 *
 * Kullanim:
 * ```tsx
 * <Drawer open={isOpen} onClose={() => setIsOpen(false)} side="left" title="Menu">
 *   <nav>...</nav>
 * </Drawer>
 * ```
 */

import { useEffect, useRef, type ReactNode } from 'react';
import { FaTimes } from 'react-icons/fa';

interface DrawerProps {
  /** Open state */
  open: boolean;
  /** Close handler */
  onClose: () => void;
  /** Drawer title */
  title?: string;
  /** Drawer side */
  side?: 'left' | 'right';
  /** Drawer genislik (Tailwind class) */
  width?: string;
  /** Backdrop click ile kapatma */
  closeOnBackdrop?: boolean;
  /** ESC ile kapatma */
  closeOnEsc?: boolean;
  /** Drawer govdesi */
  children: ReactNode;
  /** Ek className (panel icin) */
  className?: string;
}

const SLIDE_IN_CLASSES = {
  left: {
    base: 'left-0 top-0 bottom-0',
    open: 'translate-x-0',
    closed: '-translate-x-full',
  },
  right: {
    base: 'right-0 top-0 bottom-0',
    open: 'translate-x-0',
    closed: 'translate-x-full',
  },
} as const;

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Drawer({
  open,
  onClose,
  title,
  side = 'left',
  width = 'w-72 sm:w-80',
  closeOnBackdrop = true,
  closeOnEsc = true,
  children,
  className = '',
}: DrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  // Body scroll lock + ESC handler
  useEffect(() => {
    if (!open) return;

    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    document.body.classList.add('body-scroll-lock');

    if (closeOnEsc) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.classList.remove('body-scroll-lock');
        window.removeEventListener('keydown', handleKeyDown);
      };
    }

    return () => {
      document.body.classList.remove('body-scroll-lock');
    };
  }, [open, closeOnEsc, onClose]);

  // Auto-focus + restore focus on close
  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    if (!panel) return;
    const firstFocusable = panel.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
    firstFocusable?.focus();

    return () => {
      const prev = previouslyFocusedRef.current;
      if (prev && typeof prev.focus === 'function') {
        prev.focus();
      }
    };
  }, [open]);

  // Focus trap
  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key !== 'Tab') return;
    const panel = panelRef.current;
    if (!panel) return;
    const focusable = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement as HTMLElement | null;

    if (e.shiftKey && active === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const slideClasses = SLIDE_IN_CLASSES[side];

  return (
    <div
      className={`fixed inset-0 z-[90] ${open ? '' : 'pointer-events-none'}`}
      aria-hidden={!open}
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 modal-overlay transition-opacity duration-300 ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={closeOnBackdrop ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Panel */}
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onKeyDown={handleKeyDown}
        className={`absolute ${slideClasses.base} ${width} bg-white dark:bg-slate-900 shadow-2xl border-r border-slate-200/50 dark:border-slate-700/50 transition-transform duration-300 ease-out flex flex-col ${
          open ? slideClasses.open : slideClasses.closed
        } ${className}`}
      >
        {(title || closeOnBackdrop) && (
          <div className="px-4 py-3 border-b border-slate-200/50 dark:border-slate-700/50 flex-shrink-0 flex items-center justify-between gap-3">
            {title && (
              <h2 className="text-base font-bold text-slate-900 dark:text-white truncate flex-1 min-w-0">
                {title}
              </h2>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Kapat"
              className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] w-11 h-11 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 flex-shrink-0"
            >
              <FaTimes className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        )}
        <div className="flex-grow overflow-y-auto">
          {children}
        </div>
      </aside>
    </div>
  );
}

export default Drawer;
