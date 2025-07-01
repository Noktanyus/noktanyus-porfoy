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
    const fetchPopup = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // API'ye dosya uzantısını ekleyerek istek atıyoruz.
        const response = await fetch(`/api/admin/content?type=popups&slug=${params.slug}.json`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Popup verisi alınamadı.');
        }
        const data = await response.json();
        // Gelen JSON verisini doğrudan state'e ata
        setPopup(data);
      } catch (err) {
        setError((err as Error).message);
        toast.error((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    };

    if (params.slug) {
      fetchPopup();
    }
  }, [params.slug]);

  if (isLoading) {
    return <div className="text-center p-10">Yükleniyor...</div>;
  }

  if (error) {
    return <div className="text-center p-10 text-red-500">Hata: {error}</div>;
  }

  if (!popup) {
    return notFound();
  }

  return (
    <div className="bg-white dark:bg-dark-card p-8 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">Popup Düzenle: <span className="font-normal">{popup.title}</span></h1>
      <PopupForm initialData={popup} slug={params.slug} />
    </div>
  );
}
