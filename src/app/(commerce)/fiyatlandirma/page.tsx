/**
 * @file /fiyatlandirma — Abonelik planları sayfası.
 *
 * Faz D:
 *  - Plan listesi boş geldiğinde (DB erişilemez veya henüz seed edilmemiş)
 *    sayfa SESSİZCE boş bir grid gösteriyordu. Artık `EmptyState` ile durum
 *    açıkça bildirilir ve kullanıcıya iletişim çıkışı verilir.
 *  - Yükleme hatası ile "hiç plan yok" durumu ayrıştırıldı.
 *  - "14 gün ücretsiz deneme" ifadesi kaldırıldı: bu iddia plan verisinden
 *    DOĞRULANMIYOR (PlanGrid'de trial alanı gösterilmiyor) ve yanıltıcıydı.
 */

import { Metadata } from 'next';
import { commerceService } from '@/modules/commerce';
import { PlanGrid } from '@/components/commerce/PlanGrid';
import { EmptyState } from '@/components/ui/EmptyState';

export const metadata: Metadata = {
  title: 'Fiyatlandırma',
  description: 'Aylık ve yıllık abonelik planları',
};

export const dynamic = 'force-dynamic';

export default async function PricingPage() {
  let plans: Awaited<ReturnType<typeof commerceService.listPlans>> = [];
  let loadFailed = false;

  try {
    plans = await commerceService.listPlans();
  } catch (error) {
    console.error('[Fiyatlandırma] Plan listesi yüklenemedi', error);
    loadFailed = true;
    plans = [];
  }

  return (
    <div className="container-responsive bg-blob-decoration">
      <div className="relative z-10 space-responsive">
        <div className="text-center mb-12">
          <h1 className="text-responsive-display font-bold mb-4 text-foreground">
            Size Uygun Plan
          </h1>
          <p className="text-body-responsive-md text-muted-foreground max-w-2xl mx-auto">
            İhtiyaçlarınıza en uygun planı seçin. Planınızı dilediğiniz zaman
            yükseltebilir veya iptal edebilirsiniz.
          </p>
        </div>

        {plans.length > 0 ? (
          <PlanGrid plans={plans} />
        ) : (
          <EmptyState
            icon={loadFailed ? 'question' : 'inbox'}
            title={loadFailed ? 'Planlar şu an yüklenemedi' : 'Yayında plan bulunmuyor'}
            description={
              loadFailed
                ? 'Plan listesi geçici olarak alınamadı. Birkaç dakika sonra tekrar deneyin veya bizimle iletişime geçin.'
                : 'Şu anda yayında bir abonelik planı yok. Size uygun bir çözüm için bizimle iletişime geçebilirsiniz.'
            }
            action={{ label: 'İletişime Geç', href: '/iletisim' }}
            secondaryAction={{ label: 'Mağazaya Göz At', href: '/magaza' }}
            className="max-w-xl mx-auto"
          />
        )}
      </div>
    </div>
  );
}
