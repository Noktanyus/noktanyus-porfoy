/**
 * @file Sandbox controls client component
 * @description Shows the current sandbox state and lets an admin wipe
 *              transactional data with a double-confirm flow. Calls
 *              /api/sandbox/seed which is itself sandbox-gated on the server.
 *
 * Faz D: başlık `PageHeader`, kartlar `DashboardSection`, durum rozeti
 * `StatusBadge`, buton `admin-btn` sınıfları ve `ButtonSpinner` ile
 * standartlaştırıldı. API davranışı DEĞİŞTİRİLMEDİ.
 */

'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { FaFlask, FaExclamationTriangle, FaSync } from 'react-icons/fa';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { DashboardSection } from '@/components/dashboard/DashboardSection';
import { StatusBadge } from '@/components/ui/StatusBadge';

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
    <div className="admin-content-spacing">
      <PageHeader
        title="Sandbox Environment"
        description="Test ortamı durumu ve veri sıfırlama aracı."
        breadcrumb={<span>Admin / Ayarlar / Sandbox</span>}
        actions={
          <StatusBadge
            tone={isSandbox ? 'warning' : 'neutral'}
            dot
            label={isSandbox ? 'Sandbox açık' : 'Sandbox kapalı'}
            srLabel="Ortam durumu:"
          />
        }
      />

      <div className="max-w-2xl space-y-6">
        <DashboardSection
          title={
            <span className="inline-flex items-center gap-2">
              <FaFlask
                aria-hidden="true"
                className={isSandbox ? 'text-amber-500' : 'text-muted-foreground'}
              />
              Ortam Durumu
            </span>
          }
          padding="lg"
        >
          {isSandbox ? (
            <div className="space-y-4">
              <div
                role="alert"
                className="flex gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3"
              >
                <FaExclamationTriangle
                  aria-hidden="true"
                  className="mt-0.5 flex-shrink-0 text-amber-600 dark:text-amber-400"
                />
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  DİKKAT: Sandbox modu aktif. Tüm veriler test amaçlıdır ve
                  gerçek müşteri/ödeme kaydı içermez.
                </p>
              </div>

              <button
                type="button"
                onClick={handleReset}
                disabled={loading}
                className="admin-btn admin-btn-danger"
              >
                <FaSync aria-hidden="true" className={loading ? 'animate-spin' : ''} />
                {loading ? 'Sıfırlanıyor...' : 'Tüm Verileri Sıfırla'}
              </button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Sandbox modu kapalı. Production ortamında yıkıcı işlemler devre
              dışıdır. Geliştirme için <code className="font-mono">SANDBOX_MODE=true</code>{' '}
              olarak ayarlayın.
            </p>
          )}
        </DashboardSection>

        <DashboardSection title="Sandbox Tespit Sinyalleri" padding="lg">
          <ul className="list-inside list-disc space-y-1 text-xs text-muted-foreground">
            <li><code className="font-mono">SANDBOX_MODE=true</code> env değişkeni</li>
            <li>Stripe test anahtarı (<code className="font-mono">sk_test_...</code>)</li>
            <li>iyzico sandbox URI</li>
            <li><code className="font-mono">NODE_ENV !== production</code></li>
          </ul>
        </DashboardSection>
      </div>
    </div>
  );
}
