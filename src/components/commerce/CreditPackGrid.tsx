'use client';

/**
 * Ön ödemeli API kredi paketleri — önce yükle, sonra kullan.
 */

import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import { API_CREDIT_PACKS } from '@/lib/apiCredits';
import { DS } from '@/lib/design-system';

export function CreditPackGrid() {
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
            <Link
              href={`/odeme/kredi?slug=${pack.slug}`}
              className={`${DS.button.primary} w-full text-center`}
            >
              Kredi yükle
            </Link>
          </div>
        );
      })}
    </div>
  );
}
