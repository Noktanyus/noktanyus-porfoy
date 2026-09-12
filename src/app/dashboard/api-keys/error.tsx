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
    console.error('API Keys error:', error);
  }, [error]);

  return (
    <ErrorDisplay
      title="API anahtarları yüklenemedi"
      message="API anahtarların yüklenirken bir hata oluştu. Lütfen tekrar deneyin."
      onRetry={reset}
      showHomeLink
    />
  );
}
