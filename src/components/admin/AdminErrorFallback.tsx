'use client';

/**
 * @file AdminErrorFallback — Admin `error.tsx` sınırları için ortak gövde.
 *
 * Next.js her segment için ayrı bir `error.tsx` dosyası ister. Bu component
 * olmadan her dosyada aynı ikon/başlık/digest/retry düzeni tekrar yazılmak
 * zorunda kalıyordu. Ortak `ErrorDisplay` primitive'ini sarar ve üzerine
 * admin'e özgü iki şeyi ekler:
 *
 *  - `error.digest` (destek talebinde referans verilecek hata kimliği)
 *  - `reset()` ile "Tekrar Dene"
 *
 * Hata mesajı KULLANICIYA GÖSTERİLMEZ: server component hataları iç detay
 * (SQL, dosya yolu, stack) sızdırabilir. Bunun yerine sabit, anlaşılır bir
 * mesaj gösterilir; teknik detay console'a loglanır.
 */

import { useEffect } from 'react';
import { ErrorDisplay } from '@/components/ui/ErrorDisplay';

export interface AdminErrorFallbackProps {
  error: Error & { digest?: string };
  reset: () => void;
  /** Başlık — ör. "Gösterge paneli yüklenemedi" */
  title?: string;
  /** Kullanıcıya gösterilecek açıklama */
  message?: string;
  /** Log'da görünecek bağlam etiketi */
  context?: string;
}

export function AdminErrorFallback({
  error,
  reset,
  title = 'Sayfa yüklenemedi',
  message = 'İçerik yüklenirken beklenmeyen bir hata oluştu. Lütfen tekrar deneyin; sorun sürerse hata kimliğini destek ekibine iletin.',
  context = 'Admin',
}: AdminErrorFallbackProps) {
  useEffect(() => {
    // Teknik detay yalnızca log'a; arayüze sızdırılmaz.
    console.error(`${context} error:`, error);
  }, [error, context]);

  return (
    <div className="admin-content-spacing">
      <ErrorDisplay
        variant="card"
        title={title}
        message={message}
        onRetry={reset}
        showHomeLink={false}
      />
      {error.digest && (
        <p className="text-center text-xs font-mono text-muted-foreground">
          Hata kimliği: {error.digest}
        </p>
      )}
    </div>
  );
}

export default AdminErrorFallback;
