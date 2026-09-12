/**
 * @file Admin — Ürün düzenleme sayfası (sunucu tarafı).
 *
 * Faz D: `PageHeader` (breadcrumb + geri linki) + `DashboardSection` +
 * durum rozeti. Hata durumunda `ErrorDisplay` korunur.
 */

import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import ProductForm from '@/components/admin/ProductForm';
import { ErrorDisplay } from '@/components/ui/ErrorDisplay';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { DashboardSection } from '@/components/dashboard/DashboardSection';
import { StatusBadge, resolveActiveStatus } from '@/components/ui/StatusBadge';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: { slug: string };
}

export default async function EditProductPage({ params }: PageProps) {
  let product;
  let error: string | null = null;

  try {
    product = await prisma.digitalProduct.findUnique({ where: { slug: params.slug } });
  } catch (e) {
    error = e instanceof Error ? e.message : 'Ürün yüklenemedi';
  }

  if (error) {
    return (
      <div className="admin-content-spacing">
        <PageHeader
          title="Ürünü Düzenle"
          backHref="/admin/products"
          backLabel="Ürünler"
          breadcrumb={<span>Admin / Ürünler / Düzenle</span>}
        />
        <ErrorDisplay
          variant="card"
          title="Ürün yüklenemedi"
          message={error}
          showHomeLink={false}
        />
      </div>
    );
  }
  if (!product) {
    notFound();
  }

  return (
    <div className="admin-content-spacing">
      <PageHeader
        title="Ürünü Düzenle"
        description={product.title}
        backHref="/admin/products"
        backLabel="Ürünler"
        breadcrumb={<span>Admin / Ürünler / Düzenle</span>}
        actions={<StatusBadge {...resolveActiveStatus(product.active)} />}
      />
      <DashboardSection padding="lg">
        <ProductForm product={product} />
      </DashboardSection>
    </div>
  );
}
