"use client";

import { useState, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import toast from "react-hot-toast";
import { HomeSettings } from "@/types/content";

type HomePageSettingsFormData = HomeSettings;

export default function HomePageSettingsPage() {
  const { register, handleSubmit, setValue, control, formState: { isDirty, isSubmitting } } = useForm<HomePageSettingsFormData>();
  const [isLoading, setIsLoading] = useState(true);

  const featuredContentType = useWatch({
    control,
    name: "featuredContent.type",
  });

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/admin/settings?file=home-settings.json");
        if (!response.ok) throw new Error("Veri alınamadı.");
        const data = await response.json();
        setValue('featuredContent', data.featuredContent || { type: 'none' });
      } catch (error) {
        toast.error("Ana sayfa ayarları yüklenirken bir hata oluştu.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [setValue]);

  const onSubmit = async (formData: HomePageSettingsFormData) => {
    const loadingToast = toast.loading("Ayarlar kaydediliyor...");
    
    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file: "home-settings.json",
          data: formData,
        }),
      });

      if (!response.ok) throw new Error("Kaydetme başarısız oldu.");
      toast.success("Ayarlar başarıyla kaydedildi!", { id: loadingToast });
    } catch (error) {
      toast.error(`Bir hata oluştu: ${(error as Error).message}`, { id: loadingToast });
    }
  };

  if (isLoading) return <div className="text-center">Yükleniyor...</div>;

  return (
    <div className="bg-white dark:bg-dark-card p-8 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">Ana Sayfa Ayarları</h1>
      <p className="mb-6 text-gray-600 dark:text-gray-400">Bu bölümden ana sayfanızdaki isminizin sağında görünen "uçan" kutucuğun içeriğini yönetebilirsiniz.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
            <label htmlFor="featuredContent.type" className="block text-sm font-medium mb-1">İçerik Türü</label>
            <select {...register("featuredContent.type")} id="featuredContent.type" className="w-full p-2 rounded bg-gray-200 dark:bg-gray-700">
                <option value="none">Gösterme</option>
                <option value="video">YouTube Videosu</option>
                <option value="text">Metin Kutusu</option>
            </select>
        </div>

        {featuredContentType === 'video' && (
            <div>
                <label htmlFor="featuredContent.youtubeUrl" className="block text-sm font-medium mb-1">YouTube Video URL</label>
                <input {...register("featuredContent.youtubeUrl")} id="featuredContent.youtubeUrl" placeholder="https://www.youtube.com/watch?v=..." className="w-full p-2 rounded bg-gray-200 dark:bg-gray-700" />
            </div>
        )}

        {featuredContentType === 'text' && (
            <div className="space-y-4">
                <div>
                    <label htmlFor="featuredContent.textTitle" className="block text-sm font-medium mb-1">Metin Başlığı</label>
                    <input {...register("featuredContent.textTitle")} id="featuredContent.textTitle" className="w-full p-2 rounded bg-gray-200 dark:bg-gray-700" />
                </div>
                <div>
                    <label htmlFor="featuredContent.textContent" className="block text-sm font-medium mb-1">Metin İçeriği</label>
                    <textarea {...register("featuredContent.textContent")} id="featuredContent.textContent" rows={3} className="w-full p-2 rounded bg-gray-200 dark:bg-gray-700" />
                </div>
                <div>
                    <label htmlFor="featuredContent.customHtml" className="block text-sm font-medium mb-1">Özel Kod (İsteğe Bağlı)</label>
                    <textarea {...register("featuredContent.customHtml")} id="featuredContent.customHtml" rows={10} className="w-full p-2 rounded bg-gray-800 text-gray-200 font-mono" placeholder="HTML, CSS ve JS kodunuzu buraya yapıştırın..."></textarea>
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
