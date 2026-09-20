'use client';

import { FaEye, FaSignOutAlt, FaTachometerAlt } from 'react-icons/fa';
import { useSession } from 'next-auth/react';

interface AdminSidebarFooterProps {
  onSignOut: () => void;
  onNavigate?: () => void;
  disabled?: boolean;
}

/**
 * Admin sidebar alt aksiyonlar: hesabıma dön (hesap-admin), siteyi görüntüle, çıkış.
 * 48px touch target, primary tint'li iki CTA.
 */
export function AdminSidebarFooter({ onSignOut, onNavigate, disabled }: AdminSidebarFooterProps) {
  const { data: session, status } = useSession();
  const showAccountLink = status !== 'loading' && Boolean(session?.user);

  return (
    <div className="px-4 py-6 border-t border-border space-y-3 flex-shrink-0 bg-muted/50">
      {showAccountLink && (
        <a
          href="/dashboard"
          onClick={onNavigate}
          className="w-full flex items-center space-x-4 px-4 py-3 min-h-[48px] rounded-xl text-left bg-indigo-600 text-white font-medium hover:bg-indigo-700 active:bg-indigo-800 transition-colors touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 shadow-sm"
        >
          <span className="text-lg flex-shrink-0 min-w-[20px] flex items-center justify-center">
            <FaTachometerAlt aria-hidden="true" />
          </span>
          <span className="text-sm font-medium flex-1 leading-tight">Hesabıma Dön</span>
        </a>
      )}
      <a
        href="/"
        target="_blank"
        rel="noopener noreferrer"
        onClick={onNavigate}
        className="w-full flex items-center space-x-4 px-4 py-3 min-h-[48px] rounded-xl text-left bg-emerald-500 text-white font-medium hover:bg-emerald-600 active:bg-emerald-700 transition-colors touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 shadow-sm"
      >
        <span className="text-lg flex-shrink-0 min-w-[20px] flex items-center justify-center">
          <FaEye aria-hidden="true" />
        </span>
        <span className="text-sm font-medium flex-1 leading-tight">Siteyi Görüntüle</span>
      </a>
      <button
        type="button"
        onClick={onSignOut}
        disabled={disabled}
        className="w-full flex items-center space-x-4 px-4 py-3 min-h-[48px] rounded-xl text-left bg-rose-500 text-white font-medium hover:bg-rose-600 active:bg-rose-700 transition-colors touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="text-lg flex-shrink-0 min-w-[20px] flex items-center justify-center">
          <FaSignOutAlt aria-hidden="true" />
        </span>
        <span className="text-sm font-medium flex-1 leading-tight">Güvenli Çıkış</span>
      </button>
    </div>
  );
}
