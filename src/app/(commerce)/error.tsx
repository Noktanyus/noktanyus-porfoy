'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { FaStore, FaArrowLeft } from 'react-icons/fa';

export default function CommerceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Commerce module error]', error);
  }, [error]);

  return (
    <div className="container-responsive py-20">
      <div className="max-w-2xl mx-auto glass-card-premium p-8 text-center">
        <FaStore className="w-16 h-16 mx-auto text-primary mb-4" />
        <h2 className="text-2xl font-bold mb-2">Mağaza Şu An Erişilemez</h2>
        <p className="text-muted-foreground mb-6">
          Ödeme veya ürün sisteminde bir sorun var. Diğer sayfalar (Blog, Projeler) çalışıyor.
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground mb-4 font-mono">Hata ID: {error.digest}</p>
        )}
        <div className="flex gap-3 justify-center">
          <button onClick={reset} className="admin-btn admin-btn-primary">
            Tekrar Dene
          </button>
          <Link href="/" className="admin-btn admin-btn-secondary">
            <FaArrowLeft /> Anasayfa
          </Link>
        </div>
      </div>
    </div>
  );
}
