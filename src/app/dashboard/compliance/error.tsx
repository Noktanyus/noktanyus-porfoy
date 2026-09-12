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
    console.error('Compliance dashboard error:', error);
  }, [error]);

  return (
    <ErrorDisplay
      title="Compliance verileri yüklenemedi"
      message="KVKK/GDPR uyumluluk verileri yüklenirken bir hata oluştu. Lütfen tekrar deneyin."
      onRetry={reset}
      showHomeLink
    />
  );
}
