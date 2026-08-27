import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Ödeme Başarılı',
};

export default function SuccessPage() {
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
            Siparişiniz alındı. Lisans anahtarları ve fatura e-posta adresinize
            gönderildi.
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
