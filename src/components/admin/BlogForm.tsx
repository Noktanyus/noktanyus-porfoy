/**
 * @file Blog yazısı oluşturma ve düzenleme formu.
 * @description Bu bileşen, yeni bir blog yazısı eklemek veya mevcut birini
 *              düzenlemek için gerekli tüm form alanlarını ve mantığı içerir.
 *              `react-hook-form` ile form yönetimi, `react-markdown-editor-lite`
 *              ile zengin metin editörü ve `ImageUpload` ile görsel yükleme
 *              işlevselliği sunar.
 */

"use client";

import { useForm, Controller } from "react-hook-form";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Blog } from "@/types/content";
import { useEffect } from "react";
import CustomEditor from './Editor';
import { ErrorMessage } from "@hookform/error-message";
import { useSession } from "next-auth/react";
import ImageUpload from "./ImageUpload";

// Markdown editörünü sadece istemci tarafında ve ihtiyaç anında yükle


// Form verileri için tip tanımı. `tags` alanı string olarak alınır.
type BlogFormData = Omit<Blog, 'id' | 'contentHtml' | 'tags'> & {
  tags: string;
};

interface BlogFormProps {
  /** Düzenleme modu için mevcut yazı verileri. Yoksa, yeni yazı modu. */
  post?: Blog;
}



export default function BlogForm({ post }: BlogFormProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const isEditMode = !!post;

  const { 
    register, 
    handleSubmit, 
    setValue, 
    watch, 
    control,
    formState: { isSubmitting, errors, isDirty } 
  } = useForm<BlogFormData>({
    criteriaMode: "all",
    defaultValues: {
      title: post?.title || '',
      slug: post?.slug || '',
      description: post?.description || '',
      thumbnail: post?.thumbnail || '',
      author: post?.author || session?.user?.name || '',
      category: post?.category || '',
      tags: Array.isArray(post?.tags) ? post.tags.join(', ') : (post?.tags || ''),
      date: post?.date ? new Date(post.date) : new Date(),
      content: post?.content || '',
    }
  });

  // `post` prop'u değiştiğinde formu sıfırla
  useEffect(() => {
    if (post) {
      setValue('title', post.title);
      setValue('slug', post.slug);
      setValue('description', post.description);
      setValue('thumbnail', post.thumbnail);
      setValue('author', post.author || session?.user?.name || '');
      setValue('category', post.category);
      setValue('tags', Array.isArray(post.tags) ? post.tags.join(', ') : (post.tags || ''));
      setValue('date', post.date ? new Date(post.date) : new Date());
      setValue('content', post.content);
    }
  }, [post, setValue, session]);
  
  const title = watch("title");

  // Yeni yazı modunda, başlık değiştikçe slug'ı otomatik oluştur
  useEffect(() => {
    if (title && !isEditMode) {
      const newSlug = title.toLowerCase()
        .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
      setValue("slug", newSlug, { shouldValidate: true });
    }
  }, [title, setValue, isEditMode]);

  /**
   * Markdown editöründen görsel yükleme işlemini yönetir.
   * @param file - Yüklenecek dosya.
   * @returns {Promise<string>} Yüklenen görselin URL'si.
   */
  const onEditorImageUpload = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const loadingToast = toast.loading("Görsel yükleniyor...");
    try {
      const response = await fetch('/api/admin/upload', { method: 'POST', body: formData });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Yükleme başarısız oldu.');
      toast.success("Görsel yüklendi!", { id: loadingToast });
      return data.url;
    } catch (error) {
      toast.error(`Görsel yüklenemedi: ${(error as Error).message}`, { id: loadingToast });
      return '';
    }
  };

  /**
   * Form gönderildiğinde verileri API'ye gönderir.
   * @param data - Formdan gelen doğrulanmış veriler.
   */
  const onSubmit = async (data: BlogFormData) => {
    const loadingToast = toast.loading(isEditMode ? "Yazı güncelleniyor..." : "Yazı oluşturuluyor...");
    
    // Virgülle ayrılmış etiketleri diziye çevir
    const tags = data.tags.split(',').map(tag => tag.trim()).filter(Boolean);

    try {
      const response = await fetch('/api/admin/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'blog',
          slug: data.slug,
          originalSlug: isEditMode ? post?.slug : undefined,
          data: { ...data, tags, date: isEditMode ? data.date : new Date().toISOString() },
          content: data.content,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "İşlem başarısız oldu.");
      }

      toast.success(isEditMode ? "Yazı başarıyla güncellendi!" : "Yazı başarıyla oluşturuldu!", { id: loadingToast });
      router.push('/admin/blog');
      router.refresh(); // Sayfanın sunucu tarafı verilerini yenile
    } catch (error) {
      toast.error((error as Error).message, { id: loadingToast });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="admin-content-spacing">
      <div className="admin-form-grid">
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-2">Yazı Başlığı</label>
          <input {...register("title", { required: "Başlık zorunludur." })} id="title" className="admin-input" />
          <ErrorMessage errors={errors} name="title" render={({ message }) => <p className="text-red-500 text-sm mt-1">{message}</p>} />
        </div>
        <div>
          <label htmlFor="slug" className="block text-sm font-medium mb-2">Kimlik (Slug)</label>
          <input {...register("slug", { required: "Slug zorunludur." })} id="slug" className="admin-input" />
          <ErrorMessage errors={errors} name="slug" render={({ message }) => <p className="text-red-500 text-sm mt-1">{message}</p>} />
        </div>
      </div>

      <div>
        <Controller
          name="thumbnail"
          control={control}
          render={({ field }) => (
            <ImageUpload
              value={field.value || ''}
              onChange={field.onChange}
              onRemove={() => field.onChange('')}
            />
          )}
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium mb-2">Kısa Açıklama (Özet)</label>
        <textarea {...register("description", { required: "Açıklama zorunludur." })} id="description" rows={3} className="admin-input resize-y min-h-[80px]" />
        <ErrorMessage errors={errors} name="description" render={({ message }) => <p className="text-red-500 text-sm mt-1">{message}</p>} />
      </div>

      <div className="admin-form-grid">
        <div>
          <label htmlFor="author" className="block text-sm font-medium mb-2">Yazar</label>
          <input {...register("author", { required: "Yazar zorunludur." })} id="author" className="admin-input" readOnly />
          <ErrorMessage errors={errors} name="author" render={({ message }) => <p className="text-red-500 text-sm mt-1">{message}</p>} />
        </div>
        <div>
          <label htmlFor="category" className="block text-sm font-medium mb-2">Kategori</label>
          <input {...register("category", { required: "Kategori zorunludur." })} id="category" className="admin-input" />
          <ErrorMessage errors={errors} name="category" render={({ message }) => <p className="text-red-500 text-sm mt-1">{message}</p>} />
        </div>
      </div>

      <div>
        <label htmlFor="tags" className="block text-sm font-medium mb-2">Etiketler (Virgülle Ayırın)</label>
        <input {...register("tags")} id="tags" className="admin-input" placeholder="React, JavaScript, Web Development" />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Yazı İçeriği (Markdown)</label>
        <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
          <Controller
            name="content"
            control={control}
            render={({ field }) => (
              <CustomEditor
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
        <button 
          type="button" 
          onClick={() => router.back()} 
          className="admin-button-secondary order-2 sm:order-1"
        >
          İptal
        </button>
        <button 
          type="submit" 
          disabled={!isDirty || isSubmitting} 
          className="admin-button-primary order-1 sm:order-2"
        >
          {isSubmitting ? "Kaydediliyor..." : (isEditMode ? "Değişiklikleri Kaydet" : "Yazıyı Oluştur")}
        </button>
      </div>
    </form>
  );
}
