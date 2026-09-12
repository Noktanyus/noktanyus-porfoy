/**
 * @file /odeme/plan — Abonelik planı ödeme sayfası.
 *
 * Faz D:
 *  - `Suspense` fallback'i düz "Yükleniyor..." metniydi; ortak
 *    `LoadingSkeleton` ile değiştirildi (a11y: role=status + aria-busy).
 *  - `PageHeader` (breadcrumb + fiyatlandırmaya geri dönüş) eklendi.
 *  - Ödeme mantığı `PlanCheckoutForm` içinde; DEĞİŞTİRİLMEDİ.
 */

import { Metadata } from 'next';
import { Suspense } from 'react';
import { PlanCheckoutForm } from '@/components/commerce/PlanCheckoutForm';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';

export const metadata: Metadata = {
  title: 'Plan Ödemesi',
};

export const dynamic = 'force-dynamic';

export default function PlanCheckoutPage() {
  return (
    <div className="container-responsive bg-blob-decoration">
      <div className="relative z-10 space-responsive">
        <div className="mx-auto max-w-3xl space-y-6">
          <PageHeader
            title="Aylık hizmet ödemesi"
            description="Seçtiğiniz planı onaylayıp ödemeyi tamamlayın. İstediğiniz zaman iptal edebilirsiniz."
            backHref="/magaza/abonelikler"
            backLabel="Aylık hizmetler"
            breadcrumb={<span>Mağaza / Aylık hizmetler / Ödeme</span>}
          />
          <Suspense
            fallback={
              <LoadingSkeleton
                variant="text-line"
                count={4}
                loadingLabel="Plan bilgileri yükleniyor"
              />
            }
          >
            <PlanCheckoutForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
