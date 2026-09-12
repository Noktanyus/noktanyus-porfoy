'use client';

/**
 * @file Modal - Mobile responsive modal/dialog component.
 *
 * Mobile responsive ozellikler:
 * - mobile: max-w-full (full screen bottom sheet hissi)
 * - md+: max-w-md/lg/xl (ortali kutu)
 * - touch target min-h-[44px]
 * - body scroll lock (body-scroll-lock class ile tutarli)
 * - ESC ile kapatma
 * - backdrop click ile kapatma
 * - focus trap (Tab/Shift+Tab panel icinde)
 * - aria-modal, role="dialog", aria-labelledby
 *
 * Kullanim:
 * ```tsx
 * <Modal open={isOpen} onClose={() => setIsOpen(false)} title="Baslik" size="md">
 *   <p>Icerik</p>
 * </Modal>
 * ```
 */

import { useEffect, useRef, type ReactNode } from 'react';
import { FaTimes } from 'react-icons/fa';

interface ModalProps {
  /** Open state */
  open: boolean;
  /** Close handler */
  onClose: () => void;
  /** Modal title (aria-labelledby ile baglanir) */
  title?: string;
  /** Description (aria-describedby ile baglanir) */
  description?: string;
  /** Size variant - mobile her zaman full, sonra sirayla buyur */
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  /** Close butonunu gizle */
  hideCloseButton?: boolean;
  /** Backdrop click ile kapatma (default true) */
  closeOnBackdrop?: boolean;
  /** ESC ile kapatma (default true) */
  closeOnEsc?: boolean;
  /** Modal govdesi */
  children: ReactNode;
  /** Modal footer (aksiyon butonlari) */
  footer?: ReactNode;
  /** Ek className (panel icin) */
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'md:max-w-sm',
  md: 'md:max-w-md',
  lg: 'md:max-w-lg',
  xl: 'md:max-w-xl',
  '2xl': 'md:max-w-2xl',
  full: 'md:max-w-4xl',
};

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Modal({
  open,
  onClose,
  title,
  description,
  size = 'md',
  hideCloseButton = false,
  closeOnBackdrop = true,
  closeOnEsc = true,
  children,
  footer,
  className = '',
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const titleId = title ? 'modal-title' : undefined;
  const descId = description ? 'modal-desc' : undefined;

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

  // Auto-focus first focusable element + restore focus on close
  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    if (!panel) return;
    const firstFocusable = panel.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
    firstFocusable?.focus();

    return () => {
      // Restore focus to previously focused element
      const prev = previouslyFocusedRef.current;
      if (prev && typeof prev.focus === 'function') {
        prev.focus();
      }
    };
  }, [open]);

  // Focus trap: Tab/Shift+Tab panel icinde tutar
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
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

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descId}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 modal-overlay"
        onClick={closeOnBackdrop ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        onKeyDown={handleKeyDown}
        className={`relative w-full max-w-full ${SIZE_CLASSES[size]} bg-white dark:bg-slate-900 rounded-t-2xl md:rounded-2xl shadow-2xl border border-slate-200/50 dark:border-slate-700/50 max-h-[90vh] flex flex-col animate-slide-up ${className}`}
      >
        {/* Header */}
        {(title || !hideCloseButton) && (
          <div className="flex items-center justify-between gap-3 p-4 sm:p-5 border-b border-slate-200/50 dark:border-slate-700/50 flex-shrink-0">
            <div className="min-w-0 flex-1">
              {title && (
                <h2 id="modal-title" className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
                  {title}
                </h2>
              )}
              {description && (
                <p id="modal-desc" className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  {description}
                </p>
              )}
            </div>
            {!hideCloseButton && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Kapat"
                className="flex-shrink-0 inline-flex items-center justify-center min-h-[44px] min-w-[44px] w-11 h-11 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
              >
                <FaTimes className="w-5 h-5" aria-hidden="true" />
              </button>
            )}
          </div>
        )}

        {/* Body - scrollable */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-grow">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 p-4 sm:p-5 border-t border-slate-200/50 dark:border-slate-700/50 flex-shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export default Modal;
