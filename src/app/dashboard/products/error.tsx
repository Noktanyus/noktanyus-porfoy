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
    console.error('Products error:', error);
  }, [error]);

  return (
    <ErrorDisplay
      title="Ürünler yüklenemedi"
      message="Ürün ve lisans verilerin yüklenirken bir hata oluştu. Lütfen tekrar deneyin."
      onRetry={reset}
      showHomeLink
    />
  );
}
