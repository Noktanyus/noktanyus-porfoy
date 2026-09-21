/**
 * @file Yeni abonelik planı.
 */

import type { Metadata } from 'next';
import PlanForm from '@/components/admin/PlanForm';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { DashboardSection } from '@/components/dashboard/DashboardSection';

export const metadata: Metadata = { title: 'Yeni Plan | Admin' };

export default function NewPlanPage() {
  return (
    <div className="admin-content-spacing">
      <PageHeader
        title="Yeni Plan"
        description="Fiyat, kota, deneme süresi ve vitrin özelliklerini tanımlayın."
        backHref="/admin/plans"
        backLabel="Planlar"
        breadcrumb={<span>Admin / Planlar / Yeni</span>}
      />
      <DashboardSection padding="lg">
        <PlanForm />
      </DashboardSection>
    </div>
  );
}
