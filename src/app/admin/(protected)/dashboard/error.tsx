'use client';

/**
 * @file Dashboard için hata fallback bileşeni.
 * @description Server component'lerde (Prisma sorguları vb.) oluşan hataları yakalar
 *              ve kullanıcıya yeniden deneme imkanı sunar. Next.js App Router'ın
 *              error.tsx sınırı: en yakın hata sınırına kadar hata fırlatır.
 */

import { useEffect } from 'react';
import { FaExclamationTriangle, FaRedo } from 'react-icons/fa';

interface DashboardErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ error, reset }: DashboardErrorProps) {
  useEffect(() => {
    // Hata logla (Sentry/console)
    console.error('Admin Dashboard error:', error);
  }, [error]);

  return (
    <div className="admin-content-spacing">
      <div className="admin-section p-8 text-center">
        <FaExclamationTriangle
          className="w-12 h-12 text-red-500 mx-auto mb-4"
          aria-hidden="true"
        />
        <h2 className="admin-title text-2xl mb-2">Dashboard Yüklenemedi</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
          İstatistikler yüklenirken bir hata oluştu. Lütfen tekrar deneyin.
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground mb-4 font-mono">
            Hata ID: {error.digest}
          </p>
        )}
        <button
          type="button"
          onClick={reset}
          className="admin-btn admin-btn-primary inline-flex items-center gap-2"
        >
          <FaRedo className="w-4 h-4" aria-hidden="true" />
          <span>Tekrar Dene</span>
        </button>
      </div>
    </div>
  );
}
