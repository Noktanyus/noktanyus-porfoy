import { Metadata } from 'next';
import { TipJar } from '@/components/commerce/TipJar';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Destek Ol',
  description:
    'Noktanyus açık kaynak ve portföy çalışmalarına tek seferlik destek verin.',
};

export default function DestekPage() {
  return (
    <div className="container-responsive bg-blob-decoration">
      <div className="relative z-10 max-w-xl mx-auto space-y-8 py-4">
        <div className="text-center space-y-3">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground">Destek Ol</h1>
          <p className="text-muted-foreground leading-relaxed">
            Buy Me a Coffee tarzı tek seferlik destek. Abonelik zorunlu değil — istediğin
            tutarı seç, güvenli ödeme ile katkıda bulun.
          </p>
        </div>

        <TipJar variant="card" />

        <div className="text-center text-sm text-muted-foreground space-y-2">
          <p>
            Ürün satın almak ister misin?{' '}
            <Link href="/magaza" className="text-brand-primary hover:underline font-medium">
              Mağazaya git
            </Link>
          </p>
          <p>
            Danışmanlık için{' '}
            <Link href="/randevu" className="text-brand-primary hover:underline font-medium">
              randevu al
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
