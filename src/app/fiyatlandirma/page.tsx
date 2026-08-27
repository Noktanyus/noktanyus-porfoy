import { Metadata } from 'next';
import { commerceService } from '@/modules/commerce';
import { PlanGrid } from '@/components/commerce/PlanGrid';

export const metadata: Metadata = {
  title: 'Fiyatlandırma',
  description: 'Aylık ve yıllık abonelik planları',
};

export const dynamic = 'force-dynamic';

export default async function PricingPage() {
  let plans: Awaited<ReturnType<typeof commerceService.listPlans>> = [];
  try {
    plans = await commerceService.listPlans();
  } catch {
    plans = [];
  }

  return (
    <div className="container-responsive bg-blob-decoration">
      <div className="relative z-10 space-responsive">
        <div className="text-center mb-12">
          <h1 className="text-responsive-display font-bold mb-4 text-gray-900 dark:text-white">
            Size Uygun Plan
          </h1>
          <p className="text-body-responsive-md text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            İhtiyaçlarınıza en uygun planı seçin. Tüm planlar 14 gün ücretsiz deneme ile gelir.
          </p>
        </div>

        <PlanGrid plans={plans} />
      </div>
    </div>
  );
}
