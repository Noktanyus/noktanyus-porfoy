/**
 * /odeme — Tek ürün ödeme (?slug=). Sepet yok.
 */

import { Metadata } from 'next';
import { Suspense } from 'react';
import { CheckoutForm } from '@/components/commerce/CheckoutForm';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';

export const metadata: Metadata = {
  title: 'Ödeme',
};

export const dynamic = 'force-dynamic';

export default function CheckoutPage() {
  return (
    <div className="container-responsive bg-blob-decoration">
      <div className="relative z-10 space-responsive">
        <div className="mx-auto max-w-3xl space-y-6">
          <PageHeader
            title="Ödeme"
            description="Ürünü kontrol edip ödemeyi tamamlayın."
            backHref="/magaza/urunler"
            backLabel="Hazır paketler"
            breadcrumb={<span>Mağaza / Hazır paketler / Ödeme</span>}
          />
          <Suspense
            fallback={
              <LoadingSkeleton
                variant="text-line"
                count={4}
                loadingLabel="Ödeme formu yükleniyor"
              />
            }
          >
            <CheckoutForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
