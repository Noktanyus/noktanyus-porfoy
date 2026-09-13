'use client';

/**
 * Ön ödemeli API kredi paketleri — önce yükle, sonra kullan.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '@/lib/utils';
import { API_CREDIT_PACKS } from '@/lib/apiCredits';

export function CreditPackGrid() {
  const router = useRouter();
  const [loadingSlug, setLoadingSlug] = useState<string | null>(null);

  async function buy(packSlug: string) {
    setLoadingSlug(packSlug);
    try {
      const res = await fetch('/api/checkout/credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packSlug, paymentProvider: 'paytr' }),
      });
      const json = await res.json();
      if (res.status === 401) {
        toast.error('Kredi yüklemek için giriş yapın');
        router.push(`/giris?callbackUrl=/magaza/krediler`);
        return;
      }
      if (!res.ok || !json?.data?.url) {
        toast.error(json?.error?.message ?? 'Ödeme başlatılamadı');
        return;
      }
      window.location.href = json.data.url;
    } catch {
      toast.error('Bağlantı hatası');
    } finally {
      setLoadingSlug(null);
    }
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
      {API_CREDIT_PACKS.map((pack) => {
        const perThousand = Math.round((pack.priceCents / pack.credits) * 1000);
        return (
          <div
            key={pack.slug}
            className={`glass-card-premium p-6 flex flex-col min-w-0 ${
              pack.featured ? 'ring-2 ring-brand-primary' : ''
            }`}
          >
            {pack.featured && (
              <span className="inline-block px-3 py-1 rounded-md bg-brand-primary text-white text-xs font-semibold mb-4 self-start">
                En çok tercih
              </span>
            )}
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400 mb-2">
              Kullandığın kadar öde
            </p>
            <h3 className="text-2xl font-bold mb-2 text-slate-900 dark:text-white">
              {pack.name}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">{pack.description}</p>
            <div className="mb-2">
              <span className="text-3xl sm:text-4xl font-bold text-brand-primary">
                {formatCurrency(pack.priceCents, pack.currency)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mb-6">
              ~{formatCurrency(perThousand, pack.currency)} / 1.000 istek · süresi dolmaz
            </p>
            <ul className="space-y-2 mb-6 text-sm flex-1 text-slate-700 dark:text-slate-300">
              <li>✓ {pack.credits.toLocaleString('tr-TR')} API kredisi</li>
              <li>✓ Önce ödeme, sonra erişim</li>
              <li>✓ Abonelik zorunlu değil</li>
            </ul>
            <button
              type="button"
              onClick={() => buy(pack.slug)}
              disabled={loadingSlug === pack.slug}
              className="w-full rounded-xl bg-brand-primary px-4 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
            >
              {loadingSlug === pack.slug ? 'Yönlendiriliyor…' : 'Kredi yükle'}
            </button>
          </div>
        );
      })}
    </div>
  );
}
