/**
 * @file Admin — Galeri (yüklenen görseller) yönetim sayfası.
 * @description `/api/admin/images` üzerinden yüklü görselleri listeler, indirme
 *              ve silme aksiyonları sunar.
 *
 * Faz D:
 *  - Başlık `PageHeader`, boş durum `EmptyState`, hata `ErrorDisplay`,
 *    yükleniyor `LoadingSkeleton` ile standartlaştırıldı.
 *  - Önceden fetch hatası yalnızca toast'la geçiyordu ve ekranda "Yüklü görsel
 *    bulunamadı" yazıyordu — hata ile boş durum ayırt edilemiyordu.
 *  - "Yenile" butonu gerçek bir buton görünümü + erişilebilir etiket aldı.
 *  - Hover ile açılan aksiyon katmanı klavye ile de erişilebilir hale getirildi
 *    (`focus-within:opacity-100`); önceden yalnızca fare ile ulaşılabiliyordu.
 */

"use client";

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { FaDownload, FaTrash, FaSyncAlt } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorDisplay } from '@/components/ui/ErrorDisplay';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';

interface ImageFile {
  name: string;
  url: string;
}

export default function GalleryPage() {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingName, setDeletingName] = useState<string | null>(null);

  const fetchImages = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/images');
      if (!response.ok) {
        throw new Error('Görseller alınırken bir hata oluştu.');
      }
      const data = await response.json();
      setImages(Array.isArray(data) ? data : []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Bilinmeyen bir hata oluştu.';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  const handleDelete = async (imageName: string) => {
    if (!confirm(`'${imageName}' görselini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`)) {
      return;
    }

    const toastId = toast.loading('Görsel siliniyor...');
    setDeletingName(imageName);
    try {
      const response = await fetch(`/api/admin/images?fileName=${encodeURIComponent(imageName)}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Görsel silinirken bir hata oluştu.');
      }

      toast.success('Görsel silindi.', { id: toastId });
      setImages((prev) => prev.filter((img) => img.name !== imageName));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Görsel silinemedi.', { id: toastId });
    } finally {
      setDeletingName(null);
    }
  };

  const header = (
    <PageHeader
      title="Galeri"
      description={
        error || isLoading ? undefined : `${images.length} görsel yüklü`
      }
      breadcrumb={<span>Admin / Galeri</span>}
      actions={
        <button
          type="button"
          onClick={fetchImages}
          disabled={isLoading}
          className="admin-btn admin-btn-secondary"
        >
          <FaSyncAlt
            aria-hidden="true"
            className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`}
          />
          Yenile
        </button>
      }
    />
  );

  return (
    <div className="admin-content-spacing">
      {header}

      {isLoading ? (
        <LoadingSkeleton variant="card" count={6} loadingLabel="Görseller yükleniyor" />
      ) : error ? (
        <ErrorDisplay
          variant="card"
          title="Görseller yüklenemedi"
          message={error}
          onRetry={fetchImages}
          showHomeLink={false}
        />
      ) : images.length === 0 ? (
        <EmptyState
          icon="box"
          title="Yüklü görsel yok"
          description="Blog, proje veya ürün formlarından görsel yüklediğinizde burada listelenir."
        />
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {images.map((image) => (
            <li
              key={image.name}
              className="group relative overflow-hidden rounded-lg border border-border shadow-sm"
            >
              <Image
                src={image.url}
                alt={image.name}
                width={300}
                height={300}
                className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                unoptimized
              />
              <div className="absolute inset-0 flex flex-col justify-between bg-black/60 p-2 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                <p className="break-all text-xs text-white">{image.name}</p>
                <div className="flex justify-end gap-2">
                  <a
                    href={image.url}
                    download={image.name}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-slate-900/80 text-white transition-colors hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                    aria-label={`${image.name} görselini indir`}
                  >
                    <FaDownload aria-hidden="true" />
                  </a>
                  <button
                    type="button"
                    onClick={() => handleDelete(image.name)}
                    disabled={deletingName === image.name}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-slate-900/80 text-white transition-colors hover:bg-rose-600 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                    aria-label={`${image.name} görselini sil`}
                  >
                    <FaTrash aria-hidden="true" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
