/**
 * @file ErrorDisplay - Tüm sayfalar için tutarlı hata mesajı
 *
 * a11y: `role="alert"` + `aria-live="assertive"` ile kritik hata mesajlari
 *       ekran okuyucu tarafindan HEMEN duyurulur (polite yerine assertive).
 *
 * Bu dosya artik SADECE ErrorDisplay ve ErrorBanner icerir. EmptyState
 * `EmptyState.tsx`'ten re-export edilir — tek kaynak (PageStates ve
 * diger consumer'lar ayni component'i kullanir).
 */

import { FaExclamationTriangle, FaSyncAlt, FaHome } from "react-icons/fa";
import Link from "next/link";
import { DS } from "@/lib/design-system";
import { EmptyState as EmptyStateUnified } from "./EmptyState";

/* Re-export — backward compatibility.
   Once bunu import eden consumer'lar ayni davranisi alir. */
export { EmptyStateUnified as EmptyState };

interface ErrorDisplayProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  showHomeLink?: boolean;
  variant?: "page" | "card" | "inline";
  className?: string;
}

export function ErrorDisplay({
  title = "Bir Hata Oluştu",
  message = "İçerik yüklenirken beklenmeyen bir hata meydana geldi. Lütfen daha sonra tekrar deneyin.",
  onRetry,
  showHomeLink = true,
  variant = "page",
  className = ""
}: ErrorDisplayProps) {

  const content = (
    <>
      {/* Icon */}
      <div className="w-16 h-16 mb-6 rounded-2xl bg-red-100/50 dark:bg-red-900/20 backdrop-blur-sm flex items-center justify-center" aria-hidden="true">
        <FaExclamationTriangle className="w-8 h-8 text-red-500" />
      </div>

      {/* Title */}
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
        {title}
      </h2>

      {/* Message */}
      <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto leading-relaxed">
        {message}
      </p>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        {onRetry && (
          <button
            onClick={onRetry}
            className={`${DS.button.primary} px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/20`}
          >
            <FaSyncAlt size={14} aria-hidden="true" />
            Tekrar Dene
          </button>
        )}
        {showHomeLink && (
          <Link
            href="/"
            className={`${DS.button.secondary} px-5 py-2.5 rounded-xl text-sm font-bold glass-card`}
          >
            <FaHome size={14} aria-hidden="true" />
            Ana Sayfa
          </Link>
        )}
      </div>
    </>
  );

  if (variant === "inline") {
    return (
      <div
        role="alert"
        aria-live="assertive"
        className={`flex items-center justify-center gap-2 text-red-500 dark:text-red-400 ${className}`}
      >
        <FaExclamationTriangle size={14} aria-hidden="true" />
        <span className="text-sm font-medium">{message}</span>
        {onRetry && (
          <button onClick={onRetry} className="ml-2 text-sm underline hover:no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500">
            Tekrar dene
          </button>
        )}
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div
        role="alert"
        aria-live="assertive"
        className={`glass-card p-8 flex flex-col items-center text-center ${className}`}
      >
        {content}
      </div>
    );
  }

  // Page variant (default)
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4"
    >
      <div className="glass-card p-10 max-w-md flex flex-col items-center">
        {content}
      </div>
    </div>
  );
}

/**
 * Kucuk hata gosterimi (inline banner)
 */
export function ErrorBanner({
  message,
  onDismiss
}: {
  message: string;
  onDismiss?: () => void;
}) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="glass-card p-4 flex items-center justify-between gap-4 animate-fade-in"
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-red-100/50 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0" aria-hidden="true">
          <FaExclamationTriangle className="w-4 h-4 text-red-500" />
        </div>
        <p className="text-sm text-gray-700 dark:text-gray-300">{message}</p>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded min-h-[44px] min-w-[44px] inline-flex items-center justify-center"
          aria-label="Kapat"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
