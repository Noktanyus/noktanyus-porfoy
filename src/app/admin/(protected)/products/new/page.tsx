/**
 * @file Admin — Yeni dijital ürün oluşturma sayfası (sunucu tarafı).
 *
 * Faz D: `PageHeader` (breadcrumb + geri linki) + `DashboardSection`.
 */

import ProductForm from '@/components/admin/ProductForm';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { DashboardSection } from '@/components/dashboard/DashboardSection';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Yeni Ürün | Admin' };

export default function NewProductPage() {
  return (
    <div className="admin-content-spacing">
      <PageHeader
        title="Yeni Ürün"
        description="Yeni dijital ürün ekleyin. Açıklama AI ile otomatik üretilebilir."
        backHref="/admin/products"
        backLabel="Ürünler"
        breadcrumb={<span>Admin / Ürünler / Yeni</span>}
      />
      <DashboardSection padding="lg">
        <ProductForm />
      </DashboardSection>
    </div>
  );
}
