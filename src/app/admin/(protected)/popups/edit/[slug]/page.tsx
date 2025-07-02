/**
 * @file Belirli bir popup'ı düzenleme sayfası.
 * @description URL'den alınan 'slug' parametresine göre ilgili popup'ın verilerini
 *              API'den çeker ve `PopupForm` bileşenini bu veriyle doldurarak
 *              düzenleme arayüzünü oluşturur.
 */

"use client";

import { useState, useEffect } from 'react';
import PopupForm from '@/components/admin/PopupForm';
import { notFound } from 'next/navigation';
import { Popup } from '@/types/content';
import toast from 'react-hot-toast';

type EditPopupPageProps = {
  params: {
    slug: string;
  };
};

export default function EditPopupPage({ params }: EditPopupPageProps) {
  const [popup, setPopup] = useState<Popup | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    /**
     * API'den düzenlenecek olan popup'ın verilerini getiren asenkron fonksiyon.
     */
    const fetchPopup = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // API'ye dosya uzantısını (.json) ekleyerek istek atıyoruz.
        const response = await fetch(`/api/admin/content?type=popups&slug=${params.slug}.json`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Popup verisi sunucudan alınamadı.');
        }
        const data = await response.json();
        // Gelen JSON verisini doğrudan state'e ata
        setPopup(data);
      } catch (err) {
        const errorMessage = (err as Error).message;
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    if (params.slug) {
      fetchPopup();
    }
  }, [params.slug]);

  if (isLoading) {
    return <div className="text-center p-10">Popup verileri yükleniyor...</div>;
  }

  if (error) {
    return <div className="text-center p-10 text-red-500">Hata: {error}</div>;
  }

  // Popup bulunamazsa 404 sayfasına yönlendir.
  if (!popup) {
    return notFound();
  }

  return (
    <div className="bg-white dark:bg-dark-card p-8 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">Popup Düzenle: <span className="font-normal">{popup.title}</span></h1>
      {/* Mevcut popup verileriyle doldurulmuş PopupForm bileşeni */}
      <PopupForm initialData={popup} />
    </div>
  );
}
