'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { FaUserShield, FaArrowLeft } from 'react-icons/fa';

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Auth module error]', error);
  }, [error]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-blob-decoration px-4 py-12">
      <div className="w-full max-w-md">
        <div className="glass-card-premium p-8 text-center">
          <FaUserShield className="w-12 h-12 mx-auto text-primary mb-3" />
          <h1 className="text-xl font-bold mb-2">Giriş Hatası</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Kimlik doğrulama sırasında bir hata oluştu. Lütfen tekrar deneyin.
          </p>
          {error.digest && (
            <p className="text-xs text-muted-foreground mb-4 font-mono">Hata ID: {error.digest}</p>
          )}
          <div className="flex gap-2 justify-center">
            <button onClick={reset} className="admin-btn admin-btn-primary text-sm">
              Tekrar Dene
            </button>
            <Link href="/" className="admin-btn admin-btn-secondary text-sm">
              <FaArrowLeft /> Anasayfa
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
