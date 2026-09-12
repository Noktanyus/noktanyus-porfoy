/**
 * @file Admin — Dijital Ürünler yönetim sayfası (sunucu tarafı).
 * @description Aktif ve pasif tüm dijital ürünleri listeler. Ürün ekleme/düzenleme
 *              linkleri sağlar.
 *
 * Faz D: `PageHeader`, `DashboardSection`, `ResponsiveTable`, `EmptyState` ve
 * `StatusBadge` ortak primitive'leriyle standartlaştırıldı. Aktif/pasif rozeti
 * artık tüm yüzeylerde aynı `resolveActiveStatus` eşlemesini kullanır.
 */

import Link from 'next/link';
import { FaPlus, FaStar } from 'react-icons/fa';
import { productRepository } from '@/modules/commerce';
import { formatCurrency } from '@/lib/utils';
import { ErrorDisplay } from '@/components/ui/ErrorDisplay';
import { ProductRowActions } from '@/components/admin/ProductRowActions';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { DashboardSection } from '@/components/dashboard/DashboardSection';
import { ResponsiveTable } from '@/components/ui/ResponsiveTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge, resolveActiveStatus } from '@/components/ui/StatusBadge';

// Her istekte yeniden render — DB'den canlı veri çekmek için
export const dynamic = 'force-dynamic';

export default async function AdminProductsPage() {
  let products: Awaited<ReturnType<typeof productRepository.findMany>> = [];
  let error: string | null = null;

  try {
    products = await productRepository.findMany({
      orderBy: { createdAt: 'desc' },
    });
  } catch (e) {
    error = e instanceof Error ? e.message : 'Ürünler yüklenemedi';
  }

  const header = (
    <PageHeader
      title="Ürünler"
      description={error ? undefined : `Toplam ${products.length} ürün`}
      breadcrumb={<span>Admin / Ürünler</span>}
      actions={
        <Link href="/admin/products/new" className="admin-btn admin-btn-primary">
          <FaPlus aria-hidden="true" className="w-3 h-3" />
          Yeni Ürün
        </Link>
      }
    />
  );

  if (error) {
    return (
      <div className="admin-content-spacing">
        {header}
        <ErrorDisplay
          variant="card"
          title="Ürünler yüklenemedi"
          message={error}
          showHomeLink={false}
        />
      </div>
    );
  }

  return (
    <div className="admin-content-spacing">
      {header}

      <DashboardSection padding={products.length === 0 ? 'md' : 'none'} contained>
        {products.length === 0 ? (
          <EmptyState
            variant="inline"
            icon="box"
            title="Henüz ürün yok"
            description="İlk dijital ürününüzü ekleyin. Fiyat, kategori ve dosya bilgilerini sonradan da güncelleyebilirsiniz."
            action={{ label: 'Yeni Ürün Ekle', href: '/admin/products/new' }}
          />
        ) : (
          <ResponsiveTable
            minWidth="760px"
            caption="Dijital ürünler: ürün adı, kategori, fiyat, durum ve işlemler"
            className="rounded-none border-0"
          >
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-3 text-left font-semibold">Ürün</th>
                <th scope="col" className="px-4 py-3 text-left font-semibold">Kategori</th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">Fiyat</th>
                <th scope="col" className="px-4 py-3 text-left font-semibold">Durum</th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr
                  key={p.id}
                  className="border-t border-border/40 transition-colors hover:bg-muted/40"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/products/${p.slug}`}
                      className="font-medium text-foreground transition-colors hover:text-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                    >
                      {p.title}
                    </Link>
                    <p className="mt-0.5 font-mono text-xs text-muted-foreground">/{p.slug}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{p.category}</td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums text-foreground">
                    {formatCurrency(p.priceCents, p.currency)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <StatusBadge size="sm" {...resolveActiveStatus(p.active)} />
                      {p.featured && (
                        <StatusBadge
                          size="sm"
                          tone="warning"
                          label="Öne Çıkan"
                          icon={<FaStar className="w-2.5 h-2.5" />}
                        />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <ProductRowActions
                        productId={p.id}
                        productSlug={p.slug}
                        productTitle={p.title}
                        isActive={p.active}
                      />
                    </div>
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
