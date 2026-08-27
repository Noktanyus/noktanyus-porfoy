'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { FaBalanceScale, FaArrowLeft } from 'react-icons/fa';

export default function LegalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Legal module error]', error);
  }, [error]);

  return (
    <div className="container-responsive py-20">
      <div className="max-w-2xl mx-auto glass-card-premium p-8 text-center">
        <FaBalanceScale className="w-12 h-12 mx-auto text-primary mb-3" />
        <h2 className="text-xl font-bold mb-2">Yasal Sayfa Yüklenemedi</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Yasal içerik şu an görüntülenemiyor. Diğer bölümler normal çalışıyor.
        </p>
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
  );
}
