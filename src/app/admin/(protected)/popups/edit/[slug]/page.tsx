/**
 * @file Belirli bir popup'ı düzenleme sayfası.
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import PopupForm from '@/components/admin/PopupForm';
import { Popup } from '@/types/content';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { DashboardSection } from '@/components/dashboard/DashboardSection';
import { ErrorDisplay } from '@/components/ui/ErrorDisplay';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';

export default function EditPopupPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const [popup, setPopup] = useState<Popup | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPopupData = useCallback(async () => {
    if (!slug) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/admin/content?type=popups&slug=${encodeURIComponent(slug)}`,
      );
      if (!response.ok) {
        throw new Error('Popup verileri sunucudan yüklenemedi.');
      }
      const popupData = await response.json();
      setPopup(popupData ?? null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Bilinmeyen bir hata oluştu.';
      setError(message);
      setPopup(null);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchPopupData();
  }, [fetchPopupData]);

  const header = (
    <PageHeader
      title={popup ? `Popup: ${popup.title}` : "Popup'ı Düzenle"}
      description={<span className="font-mono text-xs break-all">{slug}</span>}
      backHref="/admin/popups"
      backLabel="Popup Yönetimi"
      breadcrumb={<span>Admin / Popup&apos;lar / Düzenle</span>}
    />
  );

  if (isLoading) {
    return (
      <div className="admin-content-spacing">
        {header}
        <LoadingSkeleton variant="text-line" count={6} loadingLabel="Popup bilgileri yükleniyor" />
      </div>
    );
  }

  if (error || !popup) {
    return (
      <div className="admin-content-spacing">
        {header}
        <ErrorDisplay
          variant="card"
          title="Popup yüklenemedi"
          message={
            error ??
            'İstenen popup bulunamadı. Silinmiş olabilir veya kod hatalı olabilir.'
          }
          onRetry={fetchPopupData}
          showHomeLink={false}
        />
      </div>
    );
  }

  return (
    <div className="admin-content-spacing">
      {header}
      <DashboardSection padding="lg">
        <PopupForm initialData={popup} />
      </DashboardSection>
    </div>
  );
}
