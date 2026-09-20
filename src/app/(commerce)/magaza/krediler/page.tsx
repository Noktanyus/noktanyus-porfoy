/**
 * /magaza/krediler — Ön ödemeli API kredisi (kullandığın kadar öde).
 */

import Link from 'next/link';
import { CreditPackGrid } from '@/components/commerce/CreditPackGrid';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { staticMetadata } from '@/lib/pageMetadata';

export const metadata = staticMetadata({
  title: 'API Kredileri | Noktanyus',
  description:
    'TR yardımcı API için ön ödemeli kredi: 1 kredi = 1 istek, abonelik zorunlu değil, bakiyenin süresi dolmaz.',
  path: '/magaza/krediler',
});

export default function MagazaKredilerPage() {
  return (
    <div className="container-responsive space-responsive">
      <PageHeader
        title="API kredileri"
        description="TR yardımcı API’yi aboneliksiz kullan: önce bakiye yükle, her istek 1 kredi düşer, süresi dolmaz."
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
          <strong className="text-foreground font-medium">Aylık planla aynı API:</strong> tek fark
          ödeme şekli. Kredi yüklenmeden API çağrıları 402 döner. Aylık planın varsa önce plan kotası
          kullanılır, kota dolunca bakiyeden düşülür.
        </p>
        <p className="mt-2">
          Her ay düzenli istek atıyorsan sabit kotalı{' '}
          <Link href="/magaza/abonelikler" className="text-brand-primary font-medium hover:underline">
            API planları
          </Link>{' '}
          genelde daha ucuza gelir.
        </p>
      </div>

      <CreditPackGrid />
    </div>
  );
}
