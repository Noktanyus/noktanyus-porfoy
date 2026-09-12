/**
 * @file Ana sayfa ayarlarını yönetme sayfası (Veritabanı Uyumlu).
 * @description Bu sayfa, ana sayfada gösterilen "öne çıkan içerik" kutusunun
 *              ayarlarını veritabanından yönetmek için bir form sunar.
 *
 * Faz D:
 *  - Tüm form alanları ortak `FormField` + `DS.input` ile yeniden yazıldı;
 *    önceden `bg-gray-200 dark:bg-gray-700` gibi elle yazılmış sınıflar
 *    kullanılıyordu ve odak halkası / hata durumu yoktu.
 *  - Yükleniyor durumu `LoadingSkeleton`, yükleme hatası `ErrorDisplay`
 *    (önceden hata sadece toast'tı, form boş default'larla açılıyordu ve
 *    kaydedilirse mevcut ayarların üzerine yazma riski vardı).
 *  - Kaydet butonuna `ButtonSpinner` eklendi.
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import toast from "react-hot-toast";
import { HomeSettings } from "@prisma/client";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { FormField } from "@/components/ui/FormField";
import { ErrorDisplay } from "@/components/ui/ErrorDisplay";
import { LoadingSkeleton, ButtonSpinner } from "@/components/ui/LoadingSkeleton";
import { DS } from "@/lib/design-system";
import { cn } from "@/lib/utils";

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
  const [loadError, setLoadError] = useState<string | null>(null);

  // "featuredContentType" alanındaki değişiklikleri izle
  const featuredContentType = useWatch({
    control,
    name: "featuredContentType",
  });

  // Sayfa yüklendiğinde mevcut ayarları API'den çek
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const response = await fetch("/api/admin/settings?type=home");
      if (!response.ok) throw new Error("Ayarlar sunucudan alınamadı.");
      const data = await response.json();
      if (data) {
        reset(data); // Formu API'den gelen verilerle doldur
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Bilinmeyen bir hata oluştu.';
      setLoadError(message);
      toast.error("Ana sayfa ayarları yüklenirken bir hata oluştu.");
    } finally {
      setIsLoading(false);
    }
  }, [reset]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
      toast.success("Ayarlar kaydedildi.", { id: loadingToast });
      // Formun "isDirty" durumunu sıfırla, böylece "Kaydet" butonu devre dışı kalır.
      reset(formData);
    } catch (err) {
      toast.error(
        `Bir hata oluştu: ${err instanceof Error ? err.message : 'Bilinmeyen hata'}`,
        { id: loadingToast },
      );
    }
  };

  const header = (
    <PageHeader
      title="Ana Sayfa Öne Çıkan İçerik"
      description="Ana sayfada isminizin yanında görünen kutunun içeriğini yönetin."
      breadcrumb={<span>Admin / Ana Sayfa Ayarları</span>}
    />
  );

  if (isLoading) {
    return (
      <div className="admin-content-spacing">
        {header}
        <LoadingSkeleton variant="text-line" count={4} loadingLabel="Ayarlar yükleniyor" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="admin-content-spacing">
        {header}
        <ErrorDisplay
          variant="card"
          title="Ayarlar yüklenemedi"
          message={`${loadError} Mevcut ayarların üzerine yazılmasını önlemek için form gösterilmiyor.`}
          onRetry={fetchData}
          showHomeLink={false}
        />
      </div>
    );
  }

  return (
    <div className="admin-content-spacing">
      {header}

      <div className="max-w-3xl">
        <DashboardSection padding="lg">
          <p className="mb-6 text-sm text-muted-foreground">
            İçeriğin görünmemesi için &quot;Gösterme&quot; seçeneğini seçebilirsiniz.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <FormField id="featuredContentType" label="Öne Çıkan İçerik Türü">
              {(fieldProps) => (
                <select
                  {...register("featuredContentType")}
                  {...fieldProps}
                  className={DS.input}
                >
                  <option value="none">Gösterme</option>
                  <option value="video">YouTube Videosu</option>
                  <option value="text">Metin Kutusu</option>
                </select>
              )}
            </FormField>

            {/* Seçilen içerik türüne göre ilgili form alanlarını göster */}
            {featuredContentType === 'video' && (
              <FormField
                id="youtubeUrl"
                label="YouTube Video URL"
                helperText="Tam video bağlantısını yapıştırın."
              >
                {(fieldProps) => (
                  <input
                    {...register("youtubeUrl")}
                    {...fieldProps}
                    type="url"
                    placeholder="https://www.youtube.com/watch?v=..."
                    className={DS.input}
                  />
                )}
              </FormField>
            )}

            {featuredContentType === 'text' && (
              <div className="space-y-4">
                <FormField id="textTitle" label="Metin Başlığı">
                  {(fieldProps) => (
                    <input
                      {...register("textTitle")}
                      {...fieldProps}
                      type="text"
                      className={DS.input}
                    />
                  )}
                </FormField>

                <FormField id="textContent" label="Metin İçeriği">
                  {(fieldProps) => (
                    <textarea
                      {...register("textContent")}
                      {...fieldProps}
                      rows={3}
                      className={cn(DS.input, 'resize-y')}
                    />
                  )}
                </FormField>

                <FormField
                  id="customHtml"
                  label="Özel Kod (İsteğe Bağlı)"
                  helperText="Bu alandaki kod metin kutusunun altında doğrudan render edilir. Güvenlik riski oluşturabilecek kod eklemeyin."
                >
                  {(fieldProps) => (
                    <textarea
                      {...register("customHtml")}
                      {...fieldProps}
                      rows={10}
                      placeholder="HTML, CSS ve JS kodunuzu buraya yapıştırın..."
                      className={cn(DS.input, 'resize-y font-mono')}
                    />
                  )}
                </FormField>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={!isDirty || isSubmitting}
                className="admin-btn admin-btn-primary"
              >
                {isSubmitting ? (
                  <>
                    <ButtonSpinner size="small" />
                    Kaydediliyor…
                  </>
                ) : (
                  'Değişiklikleri Kaydet'
                )}
              </button>
            </div>
          </form>
        </DashboardSection>
      </div>
    </div>
  );
}
