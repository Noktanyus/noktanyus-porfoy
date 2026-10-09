/**
 * Dashboard — Kullanıcı referral (davet) kodu
 */

import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import { couponService } from '@/modules/commerce/couponService';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { ReferralShareClient } from '@/components/dashboard/ReferralShareClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function formatTry(cents: number) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
  }).format(cents / 100);
}

export default async function ReferralPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/giris?callbackUrl=/dashboard/referral');

  const userId = (session.user as { id: string }).id;
  const data = await couponService.getReferralStats(userId);
  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://noktanyus.com';
  const inviteUrl = `${base}/kayit?ref=${encodeURIComponent(data.referralCode)}`;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Davet et, kazan"
        description="Arkadaşlarını kayda davet et — her başarılı referral için kredi"
        actions={
          <Link href="/dashboard/partner" className="admin-btn admin-btn-secondary">
            İş ortağı programı
          </Link>
        }
      />

      <div className="grid sm:grid-cols-3 gap-3">
        {[
          { label: 'Davet kodu', value: data.referralCode },
          { label: 'Davet edilen', value: String(data.stats.count) },
          { label: 'Tahmini kazanç', value: formatTry(data.stats.earned) },
        ].map((card) => (
          <div key={card.label} className="rounded-2xl border border-border bg-card/60 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {card.label}
            </p>
            <p className="text-lg font-bold mt-1 break-all">{card.value}</p>
          </div>
        ))}
      </div>

      <ReferralShareClient inviteUrl={inviteUrl} referralCode={data.referralCode} />

      <p className="text-xs text-muted-foreground leading-relaxed">
        Kayıt sırasında <code className="text-[11px]">?ref=</code> parametresi ile kod uygulanır.
        Komisyonlu satış ortaklığı için{' '}
        <Link href="/dashboard/partner" className="text-brand-primary hover:underline">
          iş ortağı
        </Link>{' '}
        başvurusunu kullanın.
      </p>
    </div>
  );
}
