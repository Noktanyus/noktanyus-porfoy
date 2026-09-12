'use client';

import { useEffect } from 'react';
import { ErrorDisplay } from '@/components/ui/ErrorDisplay';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Orders error:', error);
  }, [error]);

  return (
    <ErrorDisplay
      title="Siparişler yüklenemedi"
      message="Sipariş geçmişin yüklenirken bir hata oluştu. Lütfen tekrar deneyin."
      onRetry={reset}
      showHomeLink
    />
  );
}
