/**
 * @file Belirli bir popup'ı düzenleme sayfası.
 * @description URL'den alınan 'slug' parametresine göre ilgili popup'ın verilerini
 *              API'den çeker ve `PopupForm` bileşenini bu veriyle doldurarak
 *              düzenleme arayüzünü oluşturur.
 */

"use client";

import { useState, useEffect } from "react";
import PopupForm from "@/components/admin/PopupForm";
import { Popup } from "@/types/content";
import toast from "react-hot-toast";

/**
 * Popup düzenleme sayfasının ana bileşeni.
 * @param {{ params: { slug: string } }} props - Sayfanın aldığı proplar. `params.slug` düzenlenecek popup'ın kimliğidir.
 */
export default function EditPopupPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const [popup, setPopup] = useState<Popup | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Slug parametresi yoksa işlem yapma.
    if (!slug) return;

    /**
     * API'den düzenlenecek olan popup'ın verilerini getiren asenkron fonksiyon.
     */
    const fetchPopupData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/admin/content?type=popups&slug=${slug}`);
        if (!response.ok) {
          throw new Error("Popup verileri sunucudan yüklenemedi.");
        }
        const popupData = await response.json();
        setPopup(popupData);
      } catch (error) {
        toast.error((error as Error).message);
        setPopup(null); // Hata durumunda mevcut popup verisini temizle.
      } finally {
        setIsLoading(false);
      }
    };

    fetchPopupData();
  }, [slug]); // useEffect, sadece slug değiştiğinde yeniden çalışır.

  // Veri yüklenirken gösterilecek içerik.
  if (isLoading) {
    return <div className="text-center p-8">Popup bilgileri yükleniyor...</div>;
  }

  // Popup bulunamadıysa veya bir hata oluştuysa gösterilecek içerik.
  if (!popup) {
    return <div className="text-center p-8 text-red-500">İstenen popup bulunamadı veya yüklenirken bir hata oluştu.</div>;
  }

  // Veri başarıyla yüklendiğinde formu göster.
  return (
    <div className="bg-white dark:bg-dark-card p-8 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">Popup&apos;ı Düzenle: {popup.title}</h1>
      {/* Mevcut popup verileriyle doldurulmuş PopupForm bileşeni */}
      <PopupForm initialData={popup} />
    </div>
  );
}