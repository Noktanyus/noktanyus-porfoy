/**
 * /magaza — Satış hub’ı (bireysel kullanıcı odaklı).
 * İki kanal: Hazır paketler (tek sefer) + Aylık hizmetler (abonelik).
 */

import { Metadata } from 'next';
import { StoreChannelCards, StoreTrustStrip } from '@/components/commerce/StoreChannelCards';

export const metadata: Metadata = {
  title: 'Mağaza',
  description:
    'Portföy paketleri ve aylık API hizmetleri. Tek seferlik ürün veya abonelik planı seçin.',
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
            Paket veya API planı
          </h1>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
            <strong className="text-foreground font-semibold">Hazır paketler</strong>
            {' '}tek seferlik;{' '}
            <strong className="text-foreground font-semibold">API & hizmetler</strong>
            {' '}aylık abonelikle hesabına bağlanır.
          </p>
        </header>

        <StoreChannelCards />
        <StoreTrustStrip />
      </div>
    </div>
  );
}
