"use client";

import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Popup } from '@/types/content';
import { FaSave, FaTrash, FaPlus, FaEye } from 'react-icons/fa';
import ImageUpload from '@/components/admin/ImageUpload';
import { PopupDisplay } from '@/components/PopupViewer';
import { useState, useEffect } from 'react';

type PopupFormProps = {
  initialData?: Popup;
  slug?: string;
};

// Stil sabitleri
const labelStyle = "block text-sm font-medium mb-1";
const inputStyle = "w-full p-2 rounded bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-brand-primary focus:border-transparent transition";
const errorStyle = "text-red-500 text-sm mt-1";
const cardStyle = "bg-white dark:bg-dark-card p-6 rounded-lg shadow-md";

export default function PopupForm({ initialData }: PopupFormProps) {
  const router = useRouter();
  const isEditMode = !!initialData;
  const { register, handleSubmit, control, watch, setValue, formState: { errors, isSubmitting } } = useForm<Popup>({
    defaultValues: initialData || {
      slug: '',
      title: '',
      content: '',
      imageUrl: '',
      youtubeEmbedUrl: '',
      buttons: [],
      isActive: true,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "buttons",
  });

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const watchedPopupData = watch();
  const watchedTitle = watch("title");

  // Otomatik slug oluşturma
  useEffect(() => {
    if (watchedTitle && !isEditMode) {
      const newSlug = watchedTitle.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Sadece harf, rakam, boşluk ve tire bırak
        .trim()
        .replace(/\s+/g, '-') // Boşlukları tire ile değiştir
        .replace(/-+/g, '-'); // Birden fazla tireyi tek tire yap
      setValue("slug", newSlug);
    }
  }, [watchedTitle, isEditMode, setValue]);

  const onSubmit = async (formData: Popup) => {
    const toastId = toast.loading(isEditMode ? 'Popup güncelleniyor...' : 'Popup oluşturuluyor...');
    
    const finalSlug = formData.slug;

    try {
      const response = await fetch('/api/admin/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: 'popups',
          slug: finalSlug,
          originalSlug: initialData?.slug, // Orijinal slug'ı API'ye gönder
          data: formData 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Bir hata oluştu.');
      }

      toast.success('Popup başarıyla kaydedildi!', { id: toastId });
      router.push('/admin/popups');
      router.refresh();
    } catch (error) {
      toast.error((error as Error).message, { id: toastId });
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        <div className={cardStyle}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Temel Ayarlar</h2>
            <button type="button" onClick={() => setIsPreviewOpen(true)} className="bg-gray-200 dark:bg-gray-700 text-black dark:text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center transition-colors">
              <FaEye className="mr-2" />
              Önizleme
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="title" className={labelStyle}>Başlık</label>
              <input
                id="title"
                {...register('title', { required: 'Başlık zorunludur.' })}
                placeholder="Popup Başlığı"
                className={inputStyle}
              />
              {errors.title && <p className={errorStyle}>{errors.title.message}</p>}
            </div>
            <div>
              <label htmlFor="slug" className={labelStyle}>Popup Kodu (Slug)</label>
              <input
                id="slug"
                {...register('slug', { required: 'Slug zorunludur.' })}
                placeholder="basliktan-otomatik-olusur"
                className={inputStyle}
              />
              {errors.slug && <p className={errorStyle}>{errors.slug.message}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="content" className={labelStyle}>İçerik (HTML destekler)</label>
            <textarea
              id="content"
              {...register('content')}
              placeholder="Popup içeriğini buraya yazın..."
              rows={6}
              className={inputStyle}
            />
          </div>

          <div className="flex items-center space-x-2 mt-4">
              <Controller
                name="isActive"
                control={control}
                render={({ field }) => (
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                    className="h-5 w-5 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                  />
                )}
              />
              <label htmlFor="isActive" className="font-medium cursor-pointer">Popup Aktif mi?</label>
            </div>
        </div>

        <div className={cardStyle}>
          <h2 className="text-xl font-semibold mb-4">Medya</h2>
           <div>
            <label className={labelStyle}>Görsel</label>
            <Controller
              name="imageUrl"
              control={control}
              render={({ field }) => (
                <ImageUpload
                  value={field.value || ''}
                  onChange={field.onChange}
                  onRemove={() => field.onChange('')}
                  uploadPath="popups"
                />
              )}
            />
          </div>

          <div>
            <label htmlFor="youtubeEmbedUrl" className={labelStyle}>YouTube Embed URL (Opsiyonel)</label>
            <input
              id="youtubeEmbedUrl"
              {...register('youtubeEmbedUrl')}
              placeholder="https://www.youtube.com/embed/video_id"
              className={inputStyle}
            />
          </div>
        </div>

        <div className={cardStyle}>
          <h3 className="text-xl font-semibold mb-4">Butonlar</h3>
          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg space-y-3 relative bg-gray-50 dark:bg-gray-800">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">Buton {index + 1}</h4>
                  <button type="button" onClick={() => remove(index)} className="text-red-500 hover:text-red-700 transition-colors">
                    <FaTrash />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className={labelStyle}>Buton Metni</label>
                        <input
                          {...register(`buttons.${index}.text`, { required: 'Buton metni zorunludur.' })}
                          placeholder="Örn: İncele"
                          className={inputStyle}
                        />
                    </div>
                    <div>
                        <label className={labelStyle}>Aksiyon Tipi</label>
                        <Controller
                          name={`buttons.${index}.actionType`}
                          control={control}
                          render={({ field: { onChange, value } }) => (
                            <select onChange={onChange} value={value} className={inputStyle}>
                              <option value="redirect">Yönlendirme (Link)</option>
                              <option value="show-text">Gizli Metin Göster</option>
                              <option value="run-code">Kod Çalıştır (JS)</option>
                            </select>
                          )}
                        />
                    </div>
                </div>
                <div>
                    <label className={labelStyle}>Aksiyon Değeri</label>
                    <textarea
                      {...register(`buttons.${index}.actionValue`, { required: 'Aksiyon değeri zorunludur.' })}
                      placeholder="URL, Metin, Kod"
                      rows={2}
                      className={inputStyle}
                    />
                </div>
              </div>
            ))}
          </div>
          {fields.length < 4 && (
            <button type="button" onClick={() => append({ text: '', actionType: 'redirect', actionValue: '' })} className="mt-4 bg-gray-200 dark:bg-gray-700 text-black dark:text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center transition-colors">
              <FaPlus className="mr-2" />
              Yeni Buton Ekle
            </button>
          )}
        </div>

        <div className="flex justify-end mt-8">
          <button type="submit" disabled={isSubmitting} className="bg-brand-primary text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-600 disabled:bg-gray-400 flex items-center transition-transform transform hover:scale-105">
            <FaSave className="mr-2" />
            {isSubmitting ? 'Kaydediliyor...' : (isEditMode ? 'Değişiklikleri Kaydet' : 'Popup Oluştur')}
          </button>
        </div>
      </form>

      {isPreviewOpen && (
        <PopupDisplay popup={watchedPopupData} onClose={() => setIsPreviewOpen(false)} />
      )}
    </>
  );
}
