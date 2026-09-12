/**
 * Admin — Abonelik planları listesi.
 * Vitrin: /magaza/abonelikler
 */

import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { formatCurrency } from '@/lib/utils';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { DashboardSection } from '@/components/dashboard/DashboardSection';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge, resolveActiveStatus } from '@/components/ui/StatusBadge';
import { ResponsiveTable } from '@/components/ui/ResponsiveTable';
import { SUBSCRIPTION_SERVICE_TYPES } from '@/lib/storeCatalog';

export const dynamic = 'force-dynamic';

export default async function AdminPlansPage() {
  const plans = await prisma.plan.findMany({
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
  });

  return (
    <div className="admin-content-spacing space-y-6">
      <PageHeader
        title="Abonelik Planları"
        description="API, danışmanlık ve sürekli hizmet paketleri. Vitrin: /magaza/abonelikler"
        breadcrumb={<span>Admin / Planlar</span>}
        actions={
          <Link href="/magaza/abonelikler" className="admin-btn admin-btn-secondary" target="_blank">
            Vitrini aç
          </Link>
        }
      />

      <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
        Hizmet türleri:{' '}
        {SUBSCRIPTION_SERVICE_TYPES.map((s) => s.label).join(' · ')}. Yeni plan ekleme şu an
        veritabanı / seed ile yapılır; sanal ürünler için{' '}
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
            description="Abonelik planı eklenince burada listelenir ve mağaza abonelik kanalında görünür."
            action={{ label: 'Kategori rehberi', href: '/admin/categories' }}
          />
        ) : (
          <ResponsiveTable
            minWidth="720px"
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
                  Ödeme
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
                  <td className="px-4 py-3 text-muted-foreground">{plan.interval}</td>
                  <td className="px-4 py-3">
                    <StatusBadge size="sm" {...resolveActiveStatus(plan.active)} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/odeme/plan?slug=${plan.slug}`}
                      className="text-sm text-brand-primary hover:underline"
                    >
                      Checkout
                    </Link>
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
