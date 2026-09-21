/**
 * @file Kupon düzenleme sayfası.
 */

import { notFound } from 'next/navigation';
import { couponService } from '@/modules/commerce/couponService';
import CouponForm from '@/components/admin/CouponForm';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { DashboardSection } from '@/components/dashboard/DashboardSection';

export const dynamic = 'force-dynamic';

export default async function EditCouponPage({
  params,
}: {
  params: { id: string };
}) {
  const coupon = await couponService.findById(params.id);
  if (!coupon) notFound();

  return (
    <div className="admin-content-spacing">
      <PageHeader
        title={`Kupon: ${coupon.code}`}
        description={<span className="font-mono text-xs break-all">{coupon.id}</span>}
        backHref="/admin/coupons"
        backLabel="Kuponlar"
        breadcrumb={<span>Admin / Kuponlar / Düzenle</span>}
      />
      <DashboardSection padding="lg">
        <CouponForm coupon={coupon} />
      </DashboardSection>
    </div>
  );
}
