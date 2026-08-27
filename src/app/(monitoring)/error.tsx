'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { FaHeartbeat, FaArrowLeft } from 'react-icons/fa';

export default function MonitoringError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Monitoring module error]', error);
  }, [error]);

  return (
    <main className="min-h-screen bg-blob-decoration">
      <div className="container-responsive py-20">
        <div className="max-w-2xl mx-auto glass-card-premium p-8 text-center">
          <FaHeartbeat className="w-16 h-16 mx-auto text-red-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Monitoring Sistemi Hatası</h2>
          <p className="text-muted-foreground mb-6">
            Uptime verileri şu an yüklenemedi. Diğer bölümler normal çalışıyor.
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
    </main>
  );
}
