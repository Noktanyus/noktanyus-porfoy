/**
 * /magaza/krediler — Ön ödemeli API kredisi (kullandığın kadar öde).
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { CreditPackGrid } from '@/components/commerce/CreditPackGrid';
import { PageHeader } from '@/components/dashboard/PageHeader';

export const metadata: Metadata = {
  title: 'API Kredileri',
  description: 'Önce kredi yükle, sonra TR yardımcı API’yi kullandığın kadar öde. Süresi dolmaz.',
};

export default function MagazaKredilerPage() {
  return (
    <div className="container-responsive space-responsive">
      <PageHeader
        title="API kredileri"
        description="Önce ödeme yapılır, bakiye açılır. Her istek 1 kredi düşer. Süresi dolmaz."
        backHref="/magaza"
        backLabel="Mağaza"
        breadcrumb={
          <span>
            <Link href="/magaza" className="hover:text-foreground">
              Mağaza
            </Link>
            <span className="mx-1.5 opacity-60">/</span>
            <span className="text-foreground">Krediler</span>
          </span>
        }
      />

      <div className="rounded-2xl border border-border/60 bg-muted/20 px-5 py-4 mb-8 text-sm text-muted-foreground max-w-3xl">
        <p>
          <strong className="text-foreground font-medium">Kullandığın kadar öde:</strong> kredi
          yüklemeden API çağrıları 402 döner. Aylık planın varsa önce plan kotası kullanılır; kota
          dolunca bakiyeden düşülür.
        </p>
        <p className="mt-2">
          Sabit aylık kota için{' '}
          <Link href="/magaza/abonelikler" className="text-brand-primary font-medium hover:underline">
            abonelikler
          </Link>
          .
        </p>
      </div>

      <CreditPackGrid />
    </div>
  );
}
