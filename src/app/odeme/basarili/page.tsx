import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Ödeme Başarılı',
};

interface PageProps {
  searchParams: {
    iyzico?: string;
    iyzico_error?: string;
    mock_iyzico?: string;
  };
}

export default function SuccessPage({ searchParams }: PageProps) {
  const iyzicoError = searchParams.iyzico_error;
  const iyzicoSuccess = searchParams.iyzico === 'success' || searchParams.mock_iyzico === '1';

  if (iyzicoError) {
    return (
      <div className="container-responsive">
        <div className="space-responsive">
          <div className="max-w-md mx-auto text-center py-12">
            <p className="text-6xl mb-6" aria-hidden="true">
              ⚠️
            </p>
            <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
              Ödeme Tamamlanamadı
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              iyzico ödeme doğrulaması başarısız oldu
              {iyzicoError !== 'failed' && iyzicoError !== 'no_token'
                ? ` (${iyzicoError})`
                : ''}
              . Lütfen tekrar deneyin veya destek ile iletişime geçin.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Link
                href="/magaza"
                className="inline-flex items-center justify-center px-6 py-3 rounded-xl text-base font-bold bg-brand-primary text-white hover:bg-brand-primary/90 shadow-lg transition-all duration-300"
              >
                Mağazaya Dön
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center px-6 py-3 rounded-xl text-base font-bold bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-responsive">
      <div className="space-responsive">
        <div className="max-w-md mx-auto text-center py-12">
          <p className="text-6xl mb-6" aria-hidden="true">
            ✅
          </p>
          <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
            Ödemeniz Başarılı!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            {iyzicoSuccess
              ? 'iyzico üzerinden ödemeniz başarıyla tamamlandı. Lisans anahtarları ve fatura e-posta adresinize gönderildi.'
              : 'Siparişiniz alındı. Lisans anahtarları ve fatura e-posta adresinize gönderildi.'}
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl text-base font-bold bg-brand-primary text-white hover:bg-brand-primary/90 shadow-lg transition-all duration-300"
            >
              Dashboard&apos;a Git
            </Link>
            <Link
              href="/magaza"
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl text-base font-bold bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300"
            >
              Alışverişe Devam
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
