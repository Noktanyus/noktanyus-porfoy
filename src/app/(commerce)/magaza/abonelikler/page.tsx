/**
 * /magaza/abonelikler — TR yardımcı API aylık planları.
 * Vitrin sırası: Bireysel → Profesyonel (Destek+ ek hizmet olarak sunulur).
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { commerceService } from '@/modules/commerce';
import { PlanGrid } from '@/components/commerce/PlanGrid';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/dashboard/PageHeader';

export const metadata: Metadata = {
  title: 'API Planları & Abonelikler',
  description:
    'TR yardımcı API aylık planları: Starter 2.000, Pro 10.000, Business 50.000 istek ve Kurumsal Özel Kota. API key anında açılır, istediğin zaman iptal.',
};

export const dynamic = 'force-dynamic';

export default async function MagazaAboneliklerPage() {
  let plans: Awaited<ReturnType<typeof commerceService.listPlans>> = [];
  let loadFailed = false;

  try {
    plans = await commerceService.listPlans();
  } catch {
    loadFailed = true;
    plans = [];
  }

  return (
    <div className="container-responsive space-responsive">
      <PageHeader
        title="API planları"
        description="TR yardımcı API için aylık sabit kota. Ödeme sonrası API key anında açılır, istediğin zaman iptal edebilirsin."
        backHref="/magaza"
        backLabel="Mağaza"
        breadcrumb={
          <span>
            <Link href="/magaza" className="hover:text-foreground">
              Mağaza
            </Link>
            <span className="mx-1.5 opacity-60">/</span>
            <span className="text-foreground">API planları</span>
          </span>
        }
      />

      <div className="rounded-2xl border border-border/60 bg-muted/20 px-5 py-4 mb-8 text-sm text-muted-foreground max-w-3xl">
        <p>
          <strong className="text-foreground font-medium">Starter</strong> paketi aylık 2.000 istekle başlar;
          büyüyen projeler için <strong className="text-foreground font-medium">Pro</strong> (10.000 istek) ve
          yüksek hacimli operasyonlar için <strong className="text-foreground font-medium">Business</strong> (50.000 istek + Öncelikli Destek) sunulur.
          Büyük ölçekli kurumsal altyapılar için <strong className="text-foreground font-medium">Enterprise</strong> özel kota ve SLA anlaşmasıyla sağlanır.
        </p>
        <p className="mt-2">
          Düzenli kota yerine kullandığın kadar ödemeyi tercih ediyorsan{' '}
          <Link href="/magaza/krediler" className="text-brand-primary font-medium hover:underline">
            API kredisi
          </Link>{' '}
          satın alabilirsin. Plan kotası bittiğinde hesabındaki krediler otomatik olarak devreye girer.
        </p>
      </div>

      {plans.length > 0 ? (
        <PlanGrid plans={plans} />
      ) : (
        <EmptyState
          icon={loadFailed ? 'question' : 'inbox'}
          title={loadFailed ? 'Planlar yüklenemedi' : 'Yayında plan yok'}
          description={
            loadFailed
              ? 'Liste geçici olarak alınamadı. Biraz sonra tekrar deneyin.'
              : 'Şu an yayında aylık plan yok. Aynı API’yi ön ödemeli kredi ile kullanmaya devam edebilirsiniz.'
          }
          action={{ label: 'API kredisi al', href: '/magaza/krediler' }}
          secondaryAction={{ label: 'İletişim', href: '/iletisim' }}
          className="max-w-xl mx-auto"
        />
      )}

      <p className="mt-10 text-center text-sm text-muted-foreground max-w-xl mx-auto">
        Vitrinde yalnızca bireysel ve küçük ekip planları yer alır. Özel kota veya SLA gerekiyorsa{' '}
        <Link href="/iletisim" className="text-brand-primary font-medium hover:underline">
          iletişime geçin
        </Link>
        .
      </p>
    </div>
  );
}
