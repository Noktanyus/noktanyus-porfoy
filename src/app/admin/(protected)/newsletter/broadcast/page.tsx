/**
 * Admin — Newsletter Broadcast Sayfası
 *
 * Tüm doğrulanmış abonelere email gönderim ekranı.
 * Server component, force-dynamic (admin auth her zaman güncel olmalı).
 *
 * Faz D: elle yazılmış geri linki + başlık bloğu yerine ortak `PageHeader`
 * (backHref + breadcrumb) ve `DashboardSection` kullanıldı.
 */

import { Metadata } from 'next';
import { BroadcastForm } from '@/components/admin/BroadcastForm';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { DashboardSection } from '@/components/dashboard/DashboardSection';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Broadcast | Admin' };

export default function BroadcastPage() {
  return (
    <div className="admin-content-spacing">
      <PageHeader
        title="Newsletter Broadcast"
        description="Tüm doğrulanmış ve aktif abonelere email gönderin. Gönderim geri alınamaz."
        backHref="/admin/newsletter"
        backLabel="Aboneler"
        breadcrumb={<span>Admin / Newsletter / Broadcast</span>}
      />

      <div className="max-w-3xl">
        <DashboardSection padding="lg">
          <BroadcastForm />
        </DashboardSection>
      </div>
    </div>
  );
}
