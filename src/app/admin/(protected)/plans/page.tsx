/**
 * Admin — Abonelik planları listesi + CRUD.
 */

import Link from 'next/link';
import { FaPlus } from 'react-icons/fa';
import { planAdminService } from '@/modules/commerce/planAdminService';
import { formatCurrency } from '@/lib/utils';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { DashboardSection } from '@/components/dashboard/DashboardSection';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge, resolveActiveStatus } from '@/components/ui/StatusBadge';
import { ResponsiveTable } from '@/components/ui/ResponsiveTable';
import { CommerceRowActions } from '@/components/admin/CommerceRowActions';
import { SUBSCRIPTION_SERVICE_TYPES } from '@/lib/storeCatalog';

export const dynamic = 'force-dynamic';

export default async function AdminPlansPage() {
  const plans = await planAdminService.list();

  const INTERVAL_LABELS: Record<string, string> = {
    MONTH: 'Aylık',
    YEAR: 'Yıllık',
    WEEK: 'Haftalık',
    DAY: 'Günlük',
  };

  return (
    <div className="admin-content-spacing space-y-6">
      <PageHeader
        title="Abonelik Planları"
        description="API, danışmanlık ve sürekli hizmet paketleri. Vitrin: /magaza/abonelikler"
        breadcrumb={<span>Admin / Planlar</span>}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/magaza/abonelikler" className="admin-btn admin-btn-secondary" target="_blank">
              Vitrini aç
            </Link>
            <Link href="/admin/plans/new" className="admin-btn admin-btn-primary">
              <FaPlus aria-hidden="true" className="w-3 h-3" />
              Yeni Plan
            </Link>
          </div>
        }
      />

      <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
        Hizmet türleri (rehber):{' '}
        {SUBSCRIPTION_SERVICE_TYPES.map((s) => s.label).join(' · ')}. Plan ekleme/düzenleme bu
        ekrandan yapılır; tek seferlik sanal ürünler için{' '}
        <Link href="/admin/products" className="text-brand-primary hover:underline">
          Ürün Yönetimi
        </Link>
        .
      </div>

      <DashboardSection padding={plans.length === 0 ? 'md' : 'none'} contained>
        {plans.length === 0 ? (
          <EmptyState
            variant="inline"
            icon="inbox"
            title="Plan yok"
            description="İlk abonelik planınızı ekleyin. Aktif planlar mağaza abonelik vitrininde görünür."
            action={{ label: 'Yeni Plan', href: '/admin/plans/new' }}
          />
        ) : (
          <ResponsiveTable
            minWidth="800px"
            caption="Abonelik planları"
            className="rounded-none border-0"
          >
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-3 text-left font-semibold">
                  Plan
                </th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">
                  Fiyat
                </th>
                <th scope="col" className="px-4 py-3 text-left font-semibold">
                  Periyot
                </th>
                <th scope="col" className="px-4 py-3 text-left font-semibold">
                  Durum
                </th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody>
              {plans.map((plan) => (
                <tr
                  key={plan.id}
                  className="border-t border-border/40 transition-colors hover:bg-muted/40"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium">{plan.name}</p>
                    <p className="mt-0.5 font-mono text-xs text-muted-foreground">{plan.slug}</p>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums">
                    {formatCurrency(plan.priceCents, plan.currency)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {INTERVAL_LABELS[plan.interval] ?? plan.interval}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge size="sm" {...resolveActiveStatus(plan.active)} />
                  </td>
                  <td className="px-4 py-3">
                    <CommerceRowActions
                      resource="plans"
                      id={plan.id}
                      label={plan.name}
                      editHref={`/admin/plans/edit/${plan.id}`}
                      isActive={plan.active}
                      deleteConfirm={
                        plan._count.subscriptions > 0
                          ? `'${plan.name}' planına bağlı abonelik kayıtları var; silme engellenebilir. Yine de denensin mi?`
                          : undefined
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </ResponsiveTable>
        )}
      </DashboardSection>
    </div>
  );
}
