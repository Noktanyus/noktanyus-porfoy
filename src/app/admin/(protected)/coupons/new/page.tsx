/**
 * @file Yeni kupon oluşturma.
 */

import type { Metadata } from 'next';
import CouponForm from '@/components/admin/CouponForm';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { DashboardSection } from '@/components/dashboard/DashboardSection';

export const metadata: Metadata = { title: 'Yeni Kupon | Admin' };

export default function NewCouponPage() {
  return (
    <div className="admin-content-spacing">
      <PageHeader
        title="Yeni Kupon"
        description="İndirim kodu, tip, limit ve geçerlilik tarihlerini tanımlayın."
        backHref="/admin/coupons"
        backLabel="Kuponlar"
        breadcrumb={<span>Admin / Kuponlar / Yeni</span>}
      />
      <DashboardSection padding="lg">
        <CouponForm />
      </DashboardSection>
    </div>
  );
}
