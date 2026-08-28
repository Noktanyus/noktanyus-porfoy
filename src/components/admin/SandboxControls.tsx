/**
 * @file Sandbox controls client component
 * @description Shows the current sandbox state and lets an admin wipe
 *              transactional data with a double-confirm flow. Calls
 *              /api/sandbox/seed which is itself sandbox-gated on the server.
 */

'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { FaFlask, FaExclamationTriangle, FaSync } from 'react-icons/fa';

export function SandboxControls({ isSandbox }: { isSandbox: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    const confirmed = window.confirm(
      'TÜM VERİLER SİLİNECEK. Bu işlem geri alınamaz. Devam etmek istiyor musunuz?'
    );
    if (!confirmed) return;

    setLoading(true);
    try {
      const res = await fetch('/api/sandbox/seed', { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error?.message ?? 'Sandbox resetlenemedi');
      }
      toast.success('Sandbox verileri sıfırlandı');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Bilinmeyen hata');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-dark-card p-8 rounded-lg shadow-md max-w-2xl">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <FaFlask className="text-yellow-500" />
        Sandbox Environment
      </h1>

      <div
        className={`p-6 rounded-lg border-2 ${
          isSandbox
            ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'
            : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40'
        }`}
      >
        <div className="flex items-center gap-3 mb-3">
          <FaFlask
            className={`w-6 h-6 ${isSandbox ? 'text-yellow-500' : 'text-gray-400'}`}
          />
          <span className="font-semibold">
            {isSandbox ? 'Sandbox Mode: ON' : 'Sandbox Mode: OFF'}
          </span>
        </div>

        {isSandbox ? (
          <>
            <div className="bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded p-3 mb-4 flex gap-2">
              <FaExclamationTriangle className="text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                DİKKAT: Sandbox modu aktif. Tüm veriler test amaçlıdır ve
                gerçek müşteri/ödeme kaydı içermez.
              </p>
            </div>

            <button
              type="button"
              onClick={handleReset}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium transition-colors"
            >
              <FaSync className={loading ? 'animate-spin' : ''} />
              {loading ? 'Sıfırlanıyor...' : 'Tüm Verileri Sıfırla'}
            </button>
          </>
        ) : (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Sandbox modu kapalı. Production ortamında destructive işlemler
            devre dışı. Geliştirme için <code>SANDBOX_MODE=true</code>{' '}
            olarak ayarlayın.
          </p>
        )}
      </div>

      <div className="mt-6 text-xs text-gray-500 dark:text-gray-400">
        <p>
          Sandbox tespiti şu sinyalleri kullanır:
        </p>
        <ul className="list-disc list-inside mt-1 space-y-1">
          <li><code>SANDBOX_MODE=true</code> env değişkeni</li>
          <li>Stripe test anahtarı (<code>sk_test_...</code>)</li>
          <li>iyzico sandbox URI</li>
          <li><code>NODE_ENV !== production</code></li>
        </ul>
      </div>
    </div>
  );
}