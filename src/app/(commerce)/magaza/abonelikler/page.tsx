/**
 * /magaza/abonelikler — Aylık hizmetler (Bireysel / Profesyonel / Destek+).
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { commerceService } from '@/modules/commerce';
import { PlanGrid } from '@/components/commerce/PlanGrid';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/dashboard/PageHeader';

export const metadata: Metadata = {
  title: 'Aylık Hizmetler',
  description: 'Bireysel, Profesyonel ve Destek+ planları — kolay abonelik, istediğin zaman iptal.',
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
        title="Aylık hizmetler"
        description="Tek kişi veya küçük iş için sade paketler. Kartla başla, istediğin zaman iptal et."
        backHref="/magaza"
        backLabel="Mağaza"
        breadcrumb={
          <span>
            <Link href="/magaza" className="hover:text-foreground">
              Mağaza
            </Link>
            <span className="mx-1.5 opacity-60">/</span>
            <span className="text-foreground">Aylık hizmetler</span>
          </span>
        }
      />

      <div className="rounded-2xl border border-border/60 bg-muted/20 px-5 py-4 mb-8 text-sm text-muted-foreground max-w-3xl">
        <p>
          <strong className="text-foreground font-medium">Bireysel</strong> ile başlayın, ihtiyaç
          artınca <strong className="text-foreground font-medium">Profesyonel</strong> veya kurulum
          yardımı için <strong className="text-foreground font-medium">Destek+</strong> seçin.
        </p>
        <p className="mt-2">
          İndirmeli template / script için{' '}
          <Link href="/magaza/urunler" className="text-brand-primary font-medium hover:underline">
            Hazır paketler
          </Link>
          .
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
              : 'Şu an yayında aylık plan yok. İletişime geçerek özel teklif alabilirsiniz.'
          }
          action={{ label: 'İletişim', href: '/iletisim' }}
          secondaryAction={{ label: 'Hazır paketler', href: '/magaza/urunler' }}
          className="max-w-xl mx-auto"
        />
      )}

      <p className="mt-10 text-center text-sm text-muted-foreground max-w-xl mx-auto">
        Kurumsal / özel SLA ihtiyacınız mı var?{' '}
        <Link href="/iletisim" className="text-brand-primary font-medium hover:underline">
          İletişime geçin
        </Link>
        — vitrinde yalnızca bireysel ve kolay hizmet paketleri yer alır.
      </p>
    </div>
  );
}
