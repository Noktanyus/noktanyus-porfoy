/**
 * @file Yeni bir popup oluşturma sayfası.
 * @description Boş PopupForm — PageHeader + DashboardSection shell.
 */

import type { Metadata } from 'next';
import PopupForm from '@/components/admin/PopupForm';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { DashboardSection } from '@/components/dashboard/DashboardSection';

export const metadata: Metadata = { title: 'Yeni Popup | Admin' };

export default function NewPopupPage() {
  return (
    <div className="admin-content-spacing">
      <PageHeader
        title="Yeni Popup"
        description="Kod (slug), içerik, YouTube veya buton aksiyonları tanımlayın. Paylaşım: /?rp=kod veya /?qr=kod"
        backHref="/admin/popups"
        backLabel="Popup Yönetimi"
        breadcrumb={<span>Admin / Popup&apos;lar / Yeni</span>}
      />
      <DashboardSection padding="lg">
        <PopupForm />
      </DashboardSection>
    </div>
  );
}
