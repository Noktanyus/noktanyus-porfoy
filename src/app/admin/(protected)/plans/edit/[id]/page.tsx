/**
 * @file Plan düzenleme.
 */

import { notFound } from 'next/navigation';
import { planAdminService } from '@/modules/commerce/planAdminService';
import PlanForm from '@/components/admin/PlanForm';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { DashboardSection } from '@/components/dashboard/DashboardSection';

export const dynamic = 'force-dynamic';

export default async function EditPlanPage({
  params,
}: {
  params: { id: string };
}) {
  const plan = await planAdminService.findById(params.id);
  if (!plan) notFound();

  return (
    <div className="admin-content-spacing">
      <PageHeader
        title={`Plan: ${plan.name}`}
        description={<span className="font-mono text-xs break-all">{plan.slug}</span>}
        backHref="/admin/plans"
        backLabel="Planlar"
        breadcrumb={<span>Admin / Planlar / Düzenle</span>}
      />
      <DashboardSection padding="lg">
        <PlanForm plan={plan} />
      </DashboardSection>
    </div>
  );
}
