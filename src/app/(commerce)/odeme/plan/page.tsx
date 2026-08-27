import { Metadata } from 'next';
import { Suspense } from 'react';
import { PlanCheckoutForm } from '@/components/commerce/PlanCheckoutForm';

export const metadata: Metadata = {
  title: 'Plan Ödemesi',
};

export const dynamic = 'force-dynamic';

export default function PlanCheckoutPage() {
  return (
    <div className="container-responsive bg-blob-decoration">
      <div className="relative z-10 space-responsive">
        <h1 className="text-responsive-display font-bold mb-8 text-center text-gray-900 dark:text-white">
          Abonelik Ödemesi
        </h1>
        <Suspense fallback={<div className="text-center py-12 text-gray-500">Yükleniyor...</div>}>
          <PlanCheckoutForm />
        </Suspense>
      </div>
    </div>
  );
}
