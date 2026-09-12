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
    console.error('Vendor error:', error);
  }, [error]);

  return (
    <ErrorDisplay
      title="Vendor panel yüklenemedi"
      message="Satıcı panelin yüklenirken bir hata oluştu. Lütfen tekrar deneyin."
      onRetry={reset}
      showHomeLink
    />
  );
}
