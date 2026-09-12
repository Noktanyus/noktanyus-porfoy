/**
 * @file /odeme/basarisiz — PayTR merchant_fail_url hedefi.
 */

import { Metadata } from 'next';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/ui/StatusBadge';

export const metadata: Metadata = {
  title: 'Ödeme Başarısız',
};

interface PageProps {
  searchParams: {
    tip?: string;
    sub?: string;
  };
}

export default function FailPage({ searchParams }: PageProps) {
  const isTip = searchParams.tip === '1';
  const isSub = searchParams.sub === '1';

  const description = isTip
    ? 'Destek ödemesi tamamlanamadı. Kartınızdan çekim olmadıysa tekrar deneyebilirsiniz.'
    : isSub
      ? 'Abonelik ödemesi tamamlanamadı. Tekrar deneyebilir veya fiyatlandırma sayfasından plan seçebilirsiniz.'
      : 'Ödeme tamamlanamadı. 3D Secure iptal edilmiş veya banka işlemi reddetmiş olabilir.';

  return (
    <div className="container-responsive">
      <div className="space-responsive" role="alert">
        <div className="mx-auto flex max-w-xl flex-col items-center gap-4">
          <StatusBadge tone="danger" dot label="Ödeme başarısız" srLabel="Durum:" />
          <EmptyState
            variant="page"
            icon="question"
            title="Ödeme Tamamlanamadı"
            description={description}
            action={{
              label: isTip ? 'Destek Sayfası' : isSub ? 'Fiyatlandırma' : 'Sepete Dön',
              href: isTip ? '/destek' : isSub ? '/fiyatlandirma' : '/odeme',
            }}
            secondaryAction={{ label: 'Mağaza', href: '/magaza' }}
            className="w-full"
          />
          <p className="text-xs text-center text-muted-foreground max-w-md">
            Ödeme sağlayıcısı: PayTR. Sorun sürerse destek ekibiyle iletişime geçin.
          </p>
        </div>
      </div>
    </div>
  );
}
