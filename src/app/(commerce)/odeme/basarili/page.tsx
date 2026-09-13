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
    iyzico?: string;
    iyzico_error?: string;
    mock_iyzico?: string;
    paytr?: string;
    tip?: string;
    sub?: string;
    mock_sub?: string;
    credits?: string;
  };
}

function describeError(code: string): string {
  switch (code) {
    case 'no_token':
      return 'Ödeme oturumu doğrulanamadı. İşlem tamamlanmadan sayfa kapatılmış olabilir.';
    case 'failed':
      return 'Ödeme sağlayıcısı işlemi onaylamadı. Kart bilgilerinizi kontrol edip tekrar deneyin.';
    default:
      return 'Ödeme doğrulaması tamamlanamadı. Tutar kartınızdan çekilmediyse tekrar deneyebilirsiniz.';
  }
}

export default function SuccessPage({ searchParams }: PageProps) {
  const iyzicoError = searchParams.iyzico_error;
  const iyzicoSuccess = searchParams.iyzico === 'success' || searchParams.mock_iyzico === '1';
  const isPaytr = Boolean(searchParams.paytr);
  const isTip = searchParams.tip === '1';
  const isSub = searchParams.sub === '1' || searchParams.mock_sub === '1';
  const isCredits = Boolean(searchParams.credits);

  if (iyzicoError) {
    return (
      <div className="container-responsive">
        <div className="space-responsive" role="alert">
          <div className="mx-auto flex max-w-xl flex-col items-center gap-4">
            <StatusBadge tone="danger" dot label="Ödeme tamamlanamadı" srLabel="Durum:" />
            <EmptyState
              variant="page"
              icon="question"
              title="Ödeme Tamamlanamadı"
              description={`${describeError(iyzicoError)} Sorun sürerse destek ekibiyle iletişime geçin.`}
              action={{ label: 'Mağazaya Dön', href: '/magaza' }}
              secondaryAction={{ label: 'Siparişlerim', href: '/dashboard/orders' }}
              className="w-full"
            />
            <p className="font-mono text-xs text-muted-foreground">
              Referans kodu: {iyzicoError}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const title = isTip
    ? 'Desteğiniz Alındı'
    : isSub
      ? 'Abonelik Ödemesi Alındı'
      : isCredits
        ? 'Kredi Yüklemeniz Alındı'
        : 'Ödemeniz Başarılı';

  const description = isTip
    ? 'Teşekkürler. Destek ödemeniz PayTR üzerinden alındı.'
    : isSub
      ? 'Dönem ödemeniz PayTR üzerinden alındı. Aboneliğiniz aktifleştirildi. Otomatik yenileme yoktur; süre bitince yeniden ödeme yapabilirsiniz.'
      : isCredits
        ? 'PayTR üzerinden ödemeniz alındı. API kredileriniz hesabınıza tanımlandı; bakiyenizi faturalandırma sayfasından takip edebilirsiniz.'
        : iyzicoSuccess
          ? 'iyzico üzerinden ödemeniz tamamlandı. Lisans anahtarları ve fatura e-posta adresinize gönderildi.'
          : isPaytr
            ? 'PayTR üzerinden ödemeniz alındı. Sipariş onayı e-posta ile gelir; lisanslar kısa sürede hesabınıza yansır.'
            : 'Siparişiniz alındı. Lisans anahtarları ve fatura e-posta adresinize gönderildi.';

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
