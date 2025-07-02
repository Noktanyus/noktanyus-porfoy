"use client";

import { useForm, Controller } from "react-hook-form";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Blog } from "@/types/content";
import { useEffect, useRef } from "react";
import MarkdownIt from 'markdown-it';
import dynamic from 'next/dynamic';
import 'react-markdown-editor-lite/lib/index.css';
import { ErrorMessage } from "@hookform/error-message";
import { useSession } from "next-auth/react";
import ImageUpload from "./ImageUpload";

// Markdown editörünü sadece client tarafında ve ihtiyaç anında yükle
const Editor = dynamic(() => import('react-markdown-editor-lite'), { 
  ssr: false,
  loading: () => <div className="h-96 w-full bg-gray-100 dark:bg-gray-800 animate-pulse rounded-lg flex items-center justify-center">Editör Yükleniyor...</div>
});

type BlogFormData = Omit<Blog, 'id' | 'contentHtml' | 'tags'> & {
  tags: string;
};

interface BlogFormProps {
  post?: Blog;
}

const mdParser = new MarkdownIt();

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
      tags: (post?.tags || []).join(', '),
      date: post?.date || new Date().toISOString(),
      content: post?.content || '', // İçeriği de form state'ine ekle
    }
  });
  
  const title = watch("title");

  // Slug'ı başlıktan otomatik oluşturma
  useEffect(() => {
    if (title && !isEditMode) {
      const newSlug = title.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
      setValue("slug", newSlug);
    }
  }, [title, setValue, isEditMode]);

  // Markdown editöründen görsel yükleme fonksiyonu
  const onEditorImageUpload = async (file: File) => {
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

  const onSubmit = async (data: BlogFormData) => {
    const loadingToast = toast.loading(isEditMode ? "Yazı güncelleniyor..." : "Yazı oluşturuluyor...");
    
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
          content: data.content, // content'i form verisinden al
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "İşlem başarısız oldu.");
      }

      toast.success(isEditMode ? "Yazı güncellendi!" : "Yazı oluşturuldu!", { id: loadingToast });
      router.push('/admin/blog');
      router.refresh();
    } catch (error) {
      toast.error((error as Error).message, { id: loadingToast });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-1">Yazı Başlığı</label>
          <input {...register("title", { required: "Başlık zorunludur." })} id="title" className="w-full p-2 rounded bg-gray-200 dark:bg-gray-700" />
          <ErrorMessage errors={errors} name="title" render={({ message }) => <p className="text-red-500 text-sm mt-1">{message}</p>} />
        </div>
        <div>
          <label htmlFor="slug" className="block text-sm font-medium mb-1">Slug</label>
          <input {...register("slug", { required: "Slug zorunludur." })} id="slug" className="w-full p-2 rounded bg-gray-200 dark:bg-gray-700" />
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
        <label htmlFor="description" className="block text-sm font-medium mb-1">Kısa Açıklama</label>
        <textarea {...register("description", { required: "Açıklama zorunludur." })} id="description" rows={3} className="w-full p-2 rounded bg-gray-200 dark:bg-gray-700" />
        <ErrorMessage errors={errors} name="description" render={({ message }) => <p className="text-red-500 text-sm mt-1">{message}</p>} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="author" className="block text-sm font-medium mb-1">Yazar</label>
          <input {...register("author", { required: "Yazar zorunludur." })} id="author" className="w-full p-2 rounded bg-gray-200 dark:bg-gray-700" readOnly />
          <ErrorMessage errors={errors} name="author" render={({ message }) => <p className="text-red-500 text-sm mt-1">{message}</p>} />
        </div>
        <div>
          <label htmlFor="category" className="block text-sm font-medium mb-1">Kategori</label>
          <input {...register("category", { required: "Kategori zorunludur." })} id="category" className="w-full p-2 rounded bg-gray-200 dark:bg-gray-700" />
          <ErrorMessage errors={errors} name="category" render={({ message }) => <p className="text-red-500 text-sm mt-1">{message}</p>} />
        </div>
      </div>

      <div>
        <label htmlFor="tags" className="block text-sm font-medium mb-1">Etiketler (Virgülle Ayırın)</label>
        <input {...register("tags")} id="tags" className="w-full p-2 rounded bg-gray-200 dark:bg-gray-700" />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Yazı İçeriği</label>
        <Controller
          name="content"
          control={control}
          render={({ field }) => (
            <Editor
              key={post?.slug || 'new-post'}
              defaultValue={field.value}
              renderHTML={text => mdParser.render(text)}
              onChange={({ text }) => field.onChange(text)}
              onImageUpload={onEditorImageUpload}
              className="h-96"
            />
          )}
        />
      </div>

      <div className="text-right">
        <button type="submit" disabled={!isDirty || isSubmitting} className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-400">
          {isSubmitting ? "Kaydediliyor..." : (isEditMode ? "Değişiklikleri Kaydet" : "Yazı Oluştur")}
        </button>
      </div>
    </form>
  );
}