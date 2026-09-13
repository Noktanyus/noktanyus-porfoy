/**
 * /magaza — Satış hub’ı (bireysel kullanıcı odaklı).
 * Birincil teklif: TR yardımcı API — aylık plan veya ön ödemeli kredi.
 * İkincil kanal: hazır dijital paketler.
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { StoreChannelCards, StoreTrustStrip } from '@/components/commerce/StoreChannelCards';

export const metadata: Metadata = {
  title: 'Mağaza',
  description:
    'TR yardımcı API’yi aylık planla veya ön ödemeli kredi ile kullan. Hazır dijital paketler ikincil kanal olarak sunulur.',
};

export const dynamic = 'force-dynamic';

export default function MagazaHubPage() {
  return (
    <div className="relative min-h-[70vh]">
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_rgba(14,116,144,0.12),_transparent_55%),radial-gradient(ellipse_at_bottom_right,_rgba(4,120,87,0.10),_transparent_50%)]"
        aria-hidden="true"
      />
      <div className="container-responsive space-responsive">
        <header className="max-w-3xl mx-auto text-center mb-10 sm:mb-14">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-3">
            Mağaza
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground">
            TR yardımcı API — plan veya kredi
          </h1>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
            Doğrulama, KDV/tevkifat, kıdem, iş günü ve PDF uçları tek bir API key ile açılır. İki
            ödeme yolu var:{' '}
            <strong className="text-foreground font-semibold">aylık plan</strong> ile sabit kota,{' '}
            <strong className="text-foreground font-semibold">API kredisi</strong> ile kullandığın
            kadar.
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            API dışında küçük bir{' '}
            <Link href="/magaza/urunler" className="text-brand-primary font-medium hover:underline">
              hazır paket
            </Link>{' '}
            kanalı da var — şablon ve script’ler için.
          </p>
        </header>

        <StoreChannelCards />
        <StoreTrustStrip />
      </div>
    </div>
  );
}
