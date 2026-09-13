/**
 * /odeme/kredi — Ön ödemeli API kredi yükleme.
 */

import { Metadata } from 'next';
import { Suspense } from 'react';
import { CreditCheckoutForm } from '@/components/commerce/CreditCheckoutForm';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';

export const metadata: Metadata = {
  title: 'API Kredi Ödemesi',
};

export const dynamic = 'force-dynamic';

export default function CreditCheckoutPage() {
  return (
    <div className="container-responsive bg-blob-decoration">
      <div className="relative z-10 space-responsive">
        <div className="mx-auto max-w-3xl space-y-6">
          <PageHeader
            title="API kredi yükleme"
            description="Ödeme tamamlanınca bakiyeniz açılır. Her istek 1 kredi düşer."
            backHref="/magaza/krediler"
            backLabel="Krediler"
            breadcrumb={<span>Mağaza / Krediler / Ödeme</span>}
          />
          <Suspense
            fallback={
              <LoadingSkeleton variant="text-line" count={4} loadingLabel="Paket yükleniyor" />
            }
          >
            <CreditCheckoutForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
