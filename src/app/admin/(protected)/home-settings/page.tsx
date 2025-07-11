/**
 * @file Ana sayfa ayarlarını yönetme sayfası (Veritabanı Uyumlu).
 * @description Bu sayfa, ana sayfada gösterilen "öne çıkan içerik" kutusunun
 *              ayarlarını veritabanından yönetmek için bir form sunar.
 */

"use client";

import { useState, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import toast from "react-hot-toast";
import { HomeSettings } from "@prisma/client";

type HomePageSettingsFormData = HomeSettings;

export default function HomePageSettingsPage() {
  const { 
    register, 
    handleSubmit, 
    reset,
    control, 
    formState: { isDirty, isSubmitting } 
  } = useForm<HomePageSettingsFormData>({
    defaultValues: {
      featuredContentType: 'none',
      youtubeUrl: '',
      textTitle: '',
      textContent: '',
      customHtml: ''
    }
  });
  
  const [isLoading, setIsLoading] = useState(true);

  // "featuredContentType" alanındaki değişiklikleri izle
  const featuredContentType = useWatch({
    control,
    name: "featuredContentType",
  });

  // Sayfa yüklendiğinde mevcut ayarları API'den çek
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/admin/settings?type=home");
        if (!response.ok) throw new Error("Veri alınamadı.");
        const data = await response.json();
        if (data) {
          reset(data); // Formu API'den gelen verilerle doldur
        }
      } catch (error) {
        toast.error("Ana sayfa ayarları yüklenirken bir hata oluştu.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [reset]);

  /**
   * Form gönderildiğinde verileri API'ye göndererek kaydeder.
   * @param formData - Formdan gelen veriler.
   */
  const onSubmit = async (formData: HomePageSettingsFormData) => {
    const loadingToast = toast.loading("Ayarlar kaydediliyor...");
    
    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "home",
          data: formData,
        }),
      });

      if (!response.ok) throw new Error("Ayarları kaydetme işlemi başarısız oldu.");
      const result = await response.json();
      toast.success("Ayarlar başarıyla kaydedildi!", { id: loadingToast });
      // Formun "isDirty" durumunu manuel olarak sıfırla, böylece "Kaydet" butonu devre dışı kalır.
      // Form verileri zaten güncel olduğu için arayüzde bir değişiklik olmaz.
      reset(formData);
    } catch (error) {
      toast.error(`Bir hata oluştu: ${(error as Error).message}`, { id: loadingToast });
    }
  };

  if (isLoading) return <div className="text-center p-8">Ayarlar yükleniyor...</div>;

  return (
    <div className="bg-white dark:bg-dark-card p-8 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">Ana Sayfa Öne Çıkan İçerik Ayarları</h1>
      <p className="mb-6 text-gray-600 dark:text-gray-400">
        Bu bölümden, ana sayfanızdaki isminizin sağında görünen &quot;uçan&quot; kutucuğun içeriğini yönetebilirsiniz.
        İçeriğin görünmemesi için &quot;Gösterme&quot; seçeneğini seçebilirsiniz.
      </p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
            <label htmlFor="featuredContentType" className="block text-sm font-medium mb-1">Öne Çıkan İçerik Türü</label>
            <select {...register("featuredContentType")} id="featuredContentType" className="w-full p-2 rounded bg-gray-200 dark:bg-gray-700">
                <option value="none">Gösterme</option>
                <option value="video">YouTube Videosu</option>
                <option value="text">Metin Kutusu</option>
            </select>
        </div>

        {/* Seçilen içerik türüne göre ilgili form alanlarını göster */}
        {featuredContentType === 'video' && (
            <div>
                <label htmlFor="youtubeUrl" className="block text-sm font-medium mb-1">YouTube Video URL</label>
                <input {...register("youtubeUrl")} id="youtubeUrl" placeholder="https://www.youtube.com/watch?v=..." className="w-full p-2 rounded bg-gray-200 dark:bg-gray-700" />
            </div>
        )}

        {featuredContentType === 'text' && (
            <div className="space-y-4">
                <div>
                    <label htmlFor="textTitle" className="block text-sm font-medium mb-1">Metin Başlığı</label>
                    <input {...register("textTitle")} id="textTitle" className="w-full p-2 rounded bg-gray-200 dark:bg-gray-700" />
                </div>
                <div>
                    <label htmlFor="textContent" className="block text-sm font-medium mb-1">Metin İçeriği</label>
                    <textarea {...register("textContent")} id="textContent" rows={3} className="w-full p-2 rounded bg-gray-200 dark:bg-gray-700" />
                </div>
                <div>
                    <label htmlFor="customHtml" className="block text-sm font-medium mb-1">Özel Kod (İsteğe Bağlı)</label>
                    <textarea {...register("customHtml")} id="customHtml" rows={10} className="w-full p-2 rounded bg-gray-800 text-gray-200 font-mono" placeholder="HTML, CSS ve JS kodunuzu buraya yapıştırın..."></textarea>
                    <p className="text-xs text-gray-500 mt-1">Bu alana eklenen kodlar, metin kutusunun altında doğrudan render edilir. Güvenlik riski oluşturabilecek kodlar eklememeye dikkat edin.</p>
                </div>
            </div>
        )}
        
        <div className="text-right pt-4">
          <button type="submit" disabled={!isDirty || isSubmitting} className="bg-brand-primary text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-400">
            {isSubmitting ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
          </button>
        </div>
      </form>
    </div>
  );
}