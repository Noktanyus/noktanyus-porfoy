/**
 * @file ErrorDisplay - Tüm sayfalar için tutarlı hata mesajı
 */

import { FaExclamationTriangle, FaSyncAlt, FaHome } from "react-icons/fa";
import Link from "next/link";

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
      <div className="w-16 h-16 mb-6 rounded-2xl bg-red-100/50 dark:bg-red-900/20 backdrop-blur-sm flex items-center justify-center">
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
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-brand-primary text-white hover:bg-brand-primary/90 shadow-lg shadow-brand-primary/20 transition-all duration-300"
          >
            <FaSyncAlt size={14} />
            Tekrar Dene
          </button>
        )}
        {showHomeLink && (
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold glass-card hover:bg-white/50 dark:hover:bg-gray-800/50 transition-all duration-300"
          >
            <FaHome size={14} />
            Ana Sayfa
          </Link>
        )}
      </div>
    </>
  );

  if (variant === "inline") {
    return (
      <div className={`flex items-center justify-center gap-2 text-red-500 dark:text-red-400 ${className}`}>
        <FaExclamationTriangle size={14} />
        <span className="text-sm font-medium">{message}</span>
        {onRetry && (
          <button onClick={onRetry} className="ml-2 text-sm underline hover:no-underline">
            Tekrar dene
          </button>
        )}
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div className={`glass-card p-8 flex flex-col items-center text-center ${className}`}>
        {content}
      </div>
    );
  }

  // Page variant (default)
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="glass-card-premium p-10 max-w-md flex flex-col items-center">
        {content}
      </div>
    </div>
  );
}

/**
 * Küçük hata gösterimi (inline banner)
 */
export function ErrorBanner({ 
  message, 
  onDismiss 
}: { 
  message: string; 
  onDismiss?: () => void;
}) {
  return (
    <div className="glass-card-premium p-4 flex items-center justify-between gap-4 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-red-100/50 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0">
          <FaExclamationTriangle className="w-4 h-4 text-red-500" />
        </div>
        <p className="text-sm text-gray-700 dark:text-gray-300">{message}</p>
      </div>
      {onDismiss && (
        <button 
          onClick={onDismiss}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          aria-label="Kapat"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

/**
 * Empty state gösterimi (içerik yok)
 */
export function EmptyState({
  title = "İçerik Bulunamadı",
  message = "Henüz içerik eklenmemiş.",
  icon,
  action,
  actionLabel
}: {
  title?: string;
  message?: string;
  icon?: React.ReactNode;
  action?: () => void;
  actionLabel?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] text-center px-4 py-16">
      <div className="glass-card-premium p-10 max-w-md flex flex-col items-center">
        {icon && (
          <div className="w-16 h-16 mb-6 rounded-2xl bg-gray-100/50 dark:bg-gray-800/50 backdrop-blur-sm flex items-center justify-center">
            {icon}
          </div>
        )}
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
          {title}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {message}
        </p>
        {action && actionLabel && (
          <button
            onClick={action}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-brand-primary text-white hover:bg-brand-primary/90 shadow-lg transition-all duration-300"
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}