/**
 * @file Popup yönetimi sayfası.
 * @description Bu sayfa, mevcut tüm popup'ları bir liste halinde gösterir.
 *              Kullanıcıların yeni popup eklemesine, mevcutları düzenlemesine,
 *              silmesine ve aktif/pasif durumunu değiştirmesine olanak tanır.
 *
 * Faz D:
 *  - 60 satırlık elle yazılmış tablo iskeleti `LoadingSkeleton` ile değiştirildi.
 *  - Fetch hatası sadece toast'tı; artık `ErrorDisplay` + "Tekrar Dene".
 *  - Boş durum `EmptyState`, tablo `ResponsiveTable`, başlık `PageHeader`.
 *  - Kullanılmayan `handleDelete` ölü kodu kaldırıldı (silme `DeleteButton` ile).
 *  - Toggle switch'e erişilebilir etiket eklendi (önceden yalnızca görsel bir
 *    switch'ti; ekran okuyucu neyi değiştirdiğini söyleyemiyordu).
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Popup } from "@/types/content";
import { FaPlus, FaEdit } from "react-icons/fa";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { ResponsiveTable } from "@/components/ui/ResponsiveTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorDisplay } from "@/components/ui/ErrorDisplay";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";

export default function PopupsAdminPage() {
  const [popups, setPopups] = useState<Popup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingSlug, setTogglingSlug] = useState<string | null>(null);

  /**
   * API'den tüm popup verilerini çeker ve duruma göre sıralar.
   */
  const fetchPopups = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/content?type=popups');
      if (!response.ok) throw new Error("Popup'lar sunucudan yüklenemedi.");
      const data = await response.json();
      const list: Popup[] = Array.isArray(data) ? data : [];
      // Aktif olanları üste alacak şekilde sırala
      setPopups(
        [...list].sort((a, b) => (a.isActive === b.isActive ? 0 : a.isActive ? -1 : 1)),
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Bilinmeyen bir hata oluştu.';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPopups();
  }, [fetchPopups]);

  /**
   * Bir popup'ın aktif/pasif durumunu değiştirir.
   * @param popup - Durumu değiştirilecek popup nesnesi.
   */
  const handleToggleActive = async (popup: Popup) => {
    const toastId = toast.loading('Popup durumu güncelleniyor...');
    setTogglingSlug(popup.slug);
    try {
      // Popup'ın isActive durumunu tersine çevir
      const updatedPopup = { ...popup, isActive: !popup.isActive };

      const response = await fetch('/api/admin/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'popups',
          slug: popup.slug, // Slug'ı dosya adı olarak kullan
          originalSlug: popup.slug, // Güncelleme olduğunu belirtmek için
          data: updatedPopup
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Durum güncellenemedi.');
      }

      toast.success('Durum güncellendi.', { id: toastId });
      fetchPopups(); // Listeyi yenile
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Durum güncellenemedi.', { id: toastId });
    } finally {
      setTogglingSlug(null);
    }
  };

  const header = (
    <PageHeader
      title="Popup Yönetimi"
      description="Popup'larınızı oluşturun, düzenleyin ve yayın durumunu yönetin"
      breadcrumb={<span>Admin / Popup&apos;lar</span>}
      actions={
        <Link href="/admin/popups/new" className="admin-btn admin-btn-primary">
          <FaPlus aria-hidden="true" className="w-3 h-3" />
          Yeni Popup Ekle
        </Link>
      }
    />
  );

  if (isLoading) {
    return (
      <div className="admin-content-spacing">
        {header}
        <LoadingSkeleton variant="table-row" count={5} loadingLabel="Popup'lar yükleniyor" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-content-spacing">
        {header}
        <ErrorDisplay
          variant="card"
          title="Popup'lar yüklenemedi"
          message={error}
          onRetry={fetchPopups}
          showHomeLink={false}
        />
      </div>
    );
  }

  return (
    <div className="admin-content-spacing">
      {header}

      <DashboardSection
        padding={popups.length === 0 ? 'md' : 'none'}
        contained
        meta={popups.length > 0 ? `${popups.length} popup` : undefined}
      >
        {popups.length === 0 ? (
          <EmptyState
            variant="inline"
            icon="inbox"
            title="Henüz popup oluşturulmamış"
            description="İlk popup'ınızı ekleyin. Yayına almadan önce pasif olarak kaydedebilirsiniz."
            action={{ label: 'Yeni Popup Ekle', href: '/admin/popups/new' }}
          />
        ) : (
          <ResponsiveTable
            minWidth="640px"
            caption="Popup'lar: yayın durumu, kod, başlık ve işlemler"
            className="rounded-none border-0"
          >
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-3 text-left font-semibold">Yayın</th>
                <th scope="col" className="px-4 py-3 text-left font-semibold">Popup Kodu</th>
                <th scope="col" className="px-4 py-3 text-left font-semibold">Başlık</th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {popups.map((popup) => (
                <tr
                  key={popup.slug}
                  className={`border-t border-border/40 transition-colors hover:bg-muted/40 ${
                    !popup.isActive ? 'opacity-70' : ''
                  }`}
                >
                  <td className="px-4 py-3">
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        checked={popup.isActive}
                        disabled={togglingSlug === popup.slug}
                        onChange={() => handleToggleActive(popup)}
                        className="peer sr-only"
                      />
                      <span className="sr-only">
                        {popup.title} popup&apos;ını {popup.isActive ? 'yayından kaldır' : 'yayına al'}
                      </span>
                      <span
                        aria-hidden="true"
                        className="h-6 w-11 rounded-full bg-muted-foreground/30 after:absolute after:left-[2px] after:top-0.5 after:h-5 after:w-5 after:rounded-full after:border after:border-border after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-disabled:opacity-50"
                      />
                    </label>
                  </td>
                  <td className="px-4 py-3 font-mono text-sm text-muted-foreground">
                    {popup.slug}
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground">{popup.title}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/admin/popups/edit/${popup.slug}`}
                        className="admin-btn admin-btn-ghost px-3"
                        aria-label={`${popup.title} popup'ını düzenle`}
                      >
                        <FaEdit aria-hidden="true" size={14} />
                        <span className="sr-only sm:not-sr-only">Düzenle</span>
                      </Link>
                      <DeleteButton
                        endpoint={`/api/admin/popups/${popup.slug}`}
                        itemName={popup.title}
                        confirmMessage={`'${popup.title}' popup'ını kalıcı olarak silmek istediğinizden emin misiniz?`}
                        onSuccess={() => setPopups((prev) => prev.filter((p) => p.slug !== popup.slug))}
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
