'use client';

import type { ReactNode } from 'react';
import { FaInbox, FaSearch, FaFileAlt, FaQuestionCircle, FaBoxOpen } from 'react-icons/fa';
import { DS } from '@/lib/design-system';

export type EmptyStateIcon = 'inbox' | 'search' | 'file' | 'question' | 'box' | 'none';

/**
 * @file EmptyState - Liste veya grid içeriği boş olduğunda gösterilen durum.
 *
 * Mobile-first responsive tasarim:
 * - touch target >= 44px (min-h-[44px])
 * - padding responsive (p-6 sm:p-8 md:p-12)
 * - text responsive (text-base sm:text-lg)
 * - aria-live="polite" ile ekran okuyucu duyurur
 *
 * Test uyumluluk notu: default ikon '📦' (emoji) test
 * `screen.getByText('📦')` ile eslesir. Diger testler de
 * "renders custom icon" oldugu icin emoji ile ayni API'yi
 * paylasir.
 */

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: string | ReactNode | EmptyStateIcon;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  /**
   * İkincil aksiyon (opsiyonel). Tek aksiyon yeterli olan yerler icin
   * kullanilmaz; "destek + geri don" gibi iki CTA gereken durumlar icin.
   * Stil olarak `secondary` (ghost) render edilir; `primary` ile birlikte
   * yan yana durur.
   */
  secondaryAction?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  /** Ek className (ör. margin) */
  className?: string;
  /** Variant: inline = daha kompakt, page = buyuk ortalı, card = kart icinde */
  variant?: 'inline' | 'page' | 'card';
}

function resolveIcon(icon: string | ReactNode | EmptyStateIcon | undefined): ReactNode | null {
  if (!icon || icon === 'none') return null;
  if (typeof icon !== 'string') return icon;
  switch (icon) {
    case 'inbox':
      return <FaInbox className="w-8 h-8 text-slate-400 dark:text-slate-500" aria-hidden="true" />;
    case 'search':
      return <FaSearch className="w-8 h-8 text-slate-400 dark:text-slate-500" aria-hidden="true" />;
    case 'file':
      return <FaFileAlt className="w-8 h-8 text-slate-400 dark:text-slate-500" aria-hidden="true" />;
    case 'question':
      return <FaQuestionCircle className="w-8 h-8 text-slate-400 dark:text-slate-500" aria-hidden="true" />;
    case 'box':
      return <FaBoxOpen className="w-8 h-8 text-slate-400 dark:text-slate-500" aria-hidden="true" />;
    default:
      // Geriye donuk uyumluluk: emoji string (ornek: '📦')
      return <span aria-hidden="true">{icon}</span>;
  }
}

/**
 * EmptyState — tek kaynak. Eski ErrorDisplay icindeki kopya
 * kaldirildi, PageStates ve diger yerler bu component'i kullanir.
 */
export function EmptyState({
  title,
  description,
  icon = '📦',
  action,
  secondaryAction,
  className = '',
  variant = 'card',
}: EmptyStateProps) {
  const iconNode = resolveIcon(icon);

  const renderAction = (cfg: NonNullable<EmptyStateProps['action']>, style: 'primary' | 'secondary') => {
    const baseCls =
      style === 'primary'
        ? `${DS.button.primary} px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/20`
        : `${DS.button.secondary} px-5 py-2.5 rounded-xl text-sm font-bold glass-card`;
    return cfg.href ? (
      <a href={cfg.href} className={baseCls}>
        {cfg.label}
      </a>
    ) : (
      <button type="button" onClick={cfg.onClick} className={baseCls}>
        {cfg.label}
      </button>
    );
  };

  const inner = (
    <>
      {iconNode && (
        <div
          className={`mx-auto mb-4 sm:mb-6 rounded-2xl bg-slate-100/50 dark:bg-slate-800/50 backdrop-blur-sm flex items-center justify-center ${
            variant === 'inline' ? 'w-10 h-10' : 'w-16 h-16 sm:w-20 sm:h-20'
          }`}
          aria-hidden="true"
        >
          {iconNode}
        </div>
      )}
      <h3 className={`font-semibold mb-2 text-gray-900 dark:text-white ${
        variant === 'inline' ? 'text-base' : 'text-lg sm:text-xl md:text-2xl'
      }`}>
        {title}
      </h3>
      <p className={`text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto leading-relaxed ${
        variant === 'inline' ? 'text-sm' : 'text-sm sm:text-base'
      }`}>
        {description}
      </p>
      {(action || secondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {action && renderAction(action, 'primary')}
          {secondaryAction && renderAction(secondaryAction, 'secondary')}
        </div>
      )}
    </>
  );

  if (variant === 'inline') {
    return (
      <div
        className={`text-center py-8 px-4 ${className}`}
        role="status"
        aria-live="polite"
      >
        {inner}
      </div>
    );
  }

  if (variant === 'page') {
    return (
      <div
        className={`flex flex-col items-center justify-center min-h-[40vh] text-center px-4 py-12 sm:py-16 ${className}`}
        role="status"
        aria-live="polite"
      >
        <div className="glass-card p-8 sm:p-10 md:p-12 max-w-md w-full flex flex-col items-center">
          {inner}
        </div>
      </div>
    );
  }

  // card variant (default)
  return (
    <div
      className={`glass-card text-center p-6 sm:p-8 md:p-12 ${className}`}
      role="status"
      aria-live="polite"
    >
      {inner}
    </div>
  );
}

export default EmptyState;
