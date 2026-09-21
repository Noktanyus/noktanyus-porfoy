/**
 * Admin — Mağaza kategori rehberi.
 * Sanal ürün kategorileri + abonelik hizmet türleri.
 * Ürün.category alanı bu değerlerle doldurulur.
 */

import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { DashboardSection } from '@/components/dashboard/DashboardSection';
import {
  PRODUCT_CATEGORIES,
  SUBSCRIPTION_SERVICE_TYPES,
  productCategoryLabel,
} from '@/lib/storeCatalog';

export const dynamic = 'force-dynamic';

export default async function AdminCategoriesPage() {
  const grouped = await prisma.digitalProduct.groupBy({
    by: ['category'],
    _count: { _all: true },
  });
  const countByCategory = Object.fromEntries(
    grouped.map((g) => [g.category, g._count._all])
  );

  const plans = await prisma.plan.findMany({
    orderBy: { order: 'asc' },
    select: { id: true, name: true, slug: true, active: true, description: true },
  });

  return (
    <div className="admin-content-spacing space-y-8">
      <PageHeader
        title="Kategoriler & Satış Kanalları"
        description="Sanal ürün kategorileri ve abonelik hizmet türleri. Kullanıcılar mağaza açamaz; yalnızca admin yayınlar."
        breadcrumb={<span>Admin / Kategoriler</span>}
        actions={
          <Link href="/admin/products/new" className="admin-btn admin-btn-primary">
            Yeni sanal ürün
          </Link>
        }
      />

      <DashboardSection title="Sanal ürün kategorileri" padding="md" contained>
        <p className="text-sm text-muted-foreground mb-4">
          Template, script ve paketler <code className="text-xs">/magaza/urunler</code> altında listelenir.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="py-2 pr-4 font-medium">Kod</th>
                <th className="py-2 pr-4 font-medium">Etiket</th>
                <th className="py-2 pr-4 font-medium">Açıklama</th>
                <th className="py-2 font-medium text-right">Ürün sayısı</th>
              </tr>
            </thead>
            <tbody>
              {PRODUCT_CATEGORIES.map((cat) => (
                <tr key={cat.value} className="border-b border-border/50">
                  <td className="py-3 pr-4 font-mono text-xs">{cat.value}</td>
                  <td className="py-3 pr-4 font-medium">{cat.label}</td>
                  <td className="py-3 pr-4 text-muted-foreground">{cat.description}</td>
                  <td className="py-3 text-right tabular-nums">
                    {countByCategory[cat.value] ?? 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {Object.keys(countByCategory).some(
          (k) => !PRODUCT_CATEGORIES.some((c) => c.value === k)
        ) && (
          <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm">
            <p className="font-medium text-amber-800 dark:text-amber-200 mb-1">
              Tanımsız kategori değerleri
            </p>
            <ul className="text-muted-foreground space-y-1">
              {Object.entries(countByCategory)
                .filter(([k]) => !PRODUCT_CATEGORIES.some((c) => c.value === k))
                .map(([k, n]) => (
                  <li key={k}>
                    <code className="text-xs">{k}</code> ({productCategoryLabel(k)}) — {n} ürün
                  </li>
                ))}
            </ul>
          </div>
        )}
      </DashboardSection>

      <DashboardSection title="Abonelik hizmet türleri" padding="md" contained>
        <p className="text-sm text-muted-foreground mb-4">
          API key, danışmanlık ve sürekli hizmetler <code className="text-xs">/magaza/abonelikler</code>{' '}
          altında Plan olarak yayınlanır.
        </p>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {SUBSCRIPTION_SERVICE_TYPES.map((s) => (
            <li
              key={s.value}
              className="rounded-xl border border-border/60 px-4 py-3"
            >
              <p className="font-medium">{s.label}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{s.description}</p>
              <p className="text-xs font-mono text-muted-foreground/80 mt-2">{s.value}</p>
            </li>
          ))}
        </ul>

        <div className="flex items-center justify-between gap-3 mb-3">
          <h3 className="text-sm font-semibold">Kayıtlı planlar</h3>
          <div className="flex gap-3 text-sm">
            <Link href="/admin/plans/new" className="text-brand-primary hover:underline">
              Yeni plan
            </Link>
            <Link href="/admin/plans" className="text-brand-primary hover:underline">
              Plan listesi →
            </Link>
          </div>
        </div>
        {plans.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Henüz plan yok. Seed gerekmez —{' '}
            <Link href="/admin/plans/new" className="text-brand-primary hover:underline">
              buradan
            </Link>{' '}
            ekleyebilirsiniz.
          </p>
        ) : (
          <ul className="space-y-2 text-sm">
            {plans.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/50 px-3 py-2"
              >
                <span>
                  <span className="font-medium">{p.name}</span>
                  <span className="text-muted-foreground ml-2 font-mono text-xs">{p.slug}</span>
                </span>
                <span
                  className={
                    p.active
                      ? 'text-emerald-600 dark:text-emerald-400 text-xs font-medium'
                      : 'text-muted-foreground text-xs'
                  }
                >
                  {p.active ? 'Aktif' : 'Pasif'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </DashboardSection>
    </div>
  );
}
