/**
 * @file /odeme/basarili — Ödeme sonucu sayfası.
 */

import { Metadata } from 'next';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/ui/StatusBadge';

export const metadata: Metadata = {
  title: 'Ödeme Sonucu',
};

interface PageProps {
  searchParams: {
    paytr?: string;
    tip?: string;
    sub?: string;
    mock_sub?: string;
    credits?: string;
    order?: string;
  };
}

export default function SuccessPage({ searchParams }: PageProps) {
  const isTip = searchParams.tip === '1';
  const isSub = searchParams.sub === '1' || searchParams.mock_sub === '1';
  const isCredits = Boolean(searchParams.credits);

  const title = isTip
    ? 'Desteğiniz Alındı'
    : isSub
      ? 'Abonelik Ödemesi Alındı'
      : isCredits
        ? 'Kredi Yüklemeniz Alındı'
        : 'Ödemeniz Başarılı';

  const description = isTip
    ? 'Teşekkürler. Destek ödemeniz PayTR üzerinden başarıyla alındı.'
    : isSub
      ? 'Dönem ödemeniz PayTR üzerinden alındı. Aboneliğiniz aktifleştirildi.'
      : isCredits
        ? 'PayTR üzerinden ödemeniz alındı. API kredileriniz hesabınıza tanımlandı.'
        : 'PayTR üzerinden ödemeniz başarıyla alındı. Lisans anahtarınız ve sipariş detayları e-posta adresinize gönderildi.';

  return (
    <div className="container-responsive">
      <div className="space-responsive" role="status">
        <div className="mx-auto flex max-w-xl flex-col items-center gap-4">
          <StatusBadge tone="success" dot label="Ödeme alındı" srLabel="Durum:" />
          <EmptyState
            variant="page"
            icon="box"
            title={title}
            description={description}
            action={{
              label: isTip
                ? 'Ana Sayfa'
                : isSub
                  ? 'Dashboard'
                  : isCredits
                    ? 'Kredi Bakiyem'
                    : 'Siparişlerime Git',
              href: isTip
                ? '/'
                : isSub
                  ? '/dashboard'
                  : isCredits
                    ? '/dashboard/billing'
                    : '/dashboard/orders',
            }}
            secondaryAction={{ label: 'Alışverişe Devam', href: '/magaza' }}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}
