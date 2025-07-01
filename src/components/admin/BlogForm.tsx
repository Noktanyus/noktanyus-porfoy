"use client";

import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Blog } from "@/types/content";
import { useEffect, useRef } from "react";
import MarkdownIt from 'markdown-it';
import Editor from 'react-markdown-editor-lite';
import 'react-markdown-editor-lite/lib/index.css';
import { ErrorMessage } from "@hookform/error-message";
import { useSession } from "next-auth/react";

type BlogFormData = Omit<Blog, 'id' | 'contentHtml'>;

interface BlogFormProps {
  post?: Blog;
}

const mdParser = new MarkdownIt();

export default function BlogForm({ post }: BlogFormProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const { register, handleSubmit, setValue, watch, formState: { isSubmitting, errors } } = useForm<BlogFormData>({
    criteriaMode: "all"
  });
  const isEditMode = !!post;
  const contentRef = useRef(post?.content || "");
  const title = watch("title");

  useEffect(() => {
    if (isEditMode && post) {
      Object.entries(post).forEach(([key, value]) => {
        if (key === 'tags' && Array.isArray(value)) {
          setValue('tags', value.join(', '));
        } else {
          setValue(key as any, value);
        }
      });
      contentRef.current = post.content || "";
    } else if (session?.user?.name) {
      // Yeni yazı oluşturulurken yazar alanını doldur
      setValue('author', session.user.name);
    }
  }, [isEditMode, post, setValue, session]);

  useEffect(() => {
    if (title && !isEditMode) {
      setValue("slug", title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, ''));
    }
  }, [title, setValue, isEditMode]);

  const onImageUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const loadingToast = toast.loading("Görsel yükleniyor...");
    try {
      const response = await fetch('/api/admin/upload', { method: 'POST', body: formData });
      if (!response.ok) throw new Error('Yükleme başarısız oldu.');
      const data = await response.json();
      toast.success("Görsel yüklendi!", { id: loadingToast });
      return data.filePath;
    } catch (error) {
      toast.error("Görsel yüklenemedi.", { id: loadingToast });
      return '';
    }
  };

  const onSubmit = async (data: BlogFormData) => {
    const loadingToast = toast.loading(isEditMode ? "Yazı güncelleniyor..." : "Yazı oluşturuluyor...");
    
    const tags = typeof data.tags === 'string' 
      ? data.tags.split(',').map(tag => tag.trim()).filter(Boolean) 
      : (Array.isArray(data.tags) ? data.tags : []);

    try {
      const response = await fetch('/api/admin/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'blog',
          slug: data.slug,
          originalSlug: isEditMode ? post?.slug : undefined,
          data: { ...data, tags, date: new Date().toISOString() },
          content: contentRef.current,
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

      <div>
        <label htmlFor="thumbnail" className="block text-sm font-medium mb-1">Başlık Görseli</label>
        <input type="file" id="thumbnailFile" onChange={async (e) => {
          if (e.target.files?.[0]) {
            const file = e.target.files[0];
            const formData = new FormData();
            formData.append('file', file);
            const res = await fetch('/api/admin/upload', { method: 'POST', body: formData });
            const data = await res.json();
            if (data.filePath) setValue("thumbnail", data.filePath);
          }
        }} className="w-full p-2 rounded bg-gray-200 dark:bg-gray-700" />
        {watch("thumbnail") && <img src={watch("thumbnail")} alt="Önizleme" className="mt-2 h-32 rounded-lg" />}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium mb-1">Kısa Açıklama</label>
        <textarea {...register("description", { required: "Açıklama zorunludur." })} id="description" rows={3} className="w-full p-2 rounded bg-gray-200 dark:bg-gray-700" />
        <ErrorMessage errors={errors} name="description" render={({ message }) => <p className="text-red-500 text-sm mt-1">{message}</p>} />
      </div>

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

      <div>
        <label htmlFor="tags" className="block text-sm font-medium mb-1">Etiketler (Virgülle Ayırın)</label>
        <input {...register("tags")} id="tags" className="w-full p-2 rounded bg-gray-200 dark:bg-gray-700" />
      </div>

      <div>
        <label>Yazı İçeriği</label>
        <Editor
          key={post?.slug || 'new-post'}
          defaultValue={contentRef.current}
          renderHTML={text => mdParser.render(text)}
          onChange={({ text }) => { contentRef.current = text; }}
          onImageUpload={onImageUpload}
          className="h-96"
        />
      </div>

      <div className="text-right">
        <button type="submit" disabled={isSubmitting} className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-400">
          {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
        </button>
      </div>
    </form>
  );
}
