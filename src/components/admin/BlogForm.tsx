"use client";

import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Blog } from "@/types/content";
import { useEffect, useState } from "react";
import MarkdownIt from 'markdown-it';
import Editor from 'react-markdown-editor-lite';
import 'react-markdown-editor-lite/lib/index.css';

const mdParser = new MarkdownIt();

type BlogFormData = Omit<Blog, 'id' | 'contentHtml'>;

interface BlogFormProps {
  post?: Blog;
  slug?: string;
}

export default function BlogForm({ post, slug }: BlogFormProps) {
  const router = useRouter();
  const { register, handleSubmit, setValue, watch, formState: { isSubmitting, errors } } = useForm<BlogFormData>();
  const [content, setContent] = useState("");
  const isEditMode = !!post;
  const title = watch("title");

  useEffect(() => {
    if (title && !isEditMode) {
      setValue("slug", title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, ''));
    }
  }, [title, setValue, isEditMode]);

  useEffect(() => {
    if (isEditMode && post) {
      Object.keys(post).forEach(key => {
        const postKey = key as keyof BlogFormData;
        if (postKey in post) {
            setValue(postKey as any, post[postKey]);
        }
      });
      setContent(post.content || "");
    }
  }, [isEditMode, post, setValue]);

  const handleEditorChange = ({ text }: { text: string }) => {
    setContent(text);
  };

  const onImageUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Image upload failed.');
      }

      const data = await response.json();
      return data.filePath; // Return the URL of the uploaded image
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Resim yüklenirken bir hata oluştu.');
      return '';
    }
  };

  const onSubmit = async (data: BlogFormData) => {
    const loadingToast = toast.loading(isEditMode ? "Güncelleniyor..." : "Oluşturuluyor...");
    const finalSlug = (slug || data.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '')) + ".md";
    const postDate = data.date ? new Date(data.date) : new Date();

    try {
      const response = await fetch('/api/admin/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'blog',
          slug: finalSlug,
          originalSlug: isEditMode ? post.slug : undefined,
          data: {
            ...data,
            date: new Date().toISOString(),
            tags: typeof data.tags === 'string' ? data.tags.split(',').map(s => s.trim()) : [],
          },
          content: content
        }),
      });

      if (!response.ok) throw new Error("İşlem başarısız oldu.");

      toast.success(isEditMode ? "Güncellendi!" : "Oluşturuldu!", { id: loadingToast });
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
        {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message as string}</p>}
      </div>

      <div>
        <label htmlFor="slug" className="block text-sm font-medium mb-1">Slug</label>
        <input {...register("slug", { required: "Slug zorunludur." })} id="slug" className="w-full p-2 rounded bg-gray-200 dark:bg-gray-700" />
        {errors.slug && <p className="text-red-500 text-sm mt-1">{errors.slug.message as string}</p>}
      </div>
      
      <div>
        <label htmlFor="thumbnail" className="block text-sm font-medium mb-1">Başlık Görseli</label>
        <input type="file" id="thumbnail" onChange={async (e) => {
          if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const formData = new FormData();
            formData.append('file', file);
            const response = await fetch('/api/admin/upload', {
              method: 'POST',
              body: formData,
            });
            const data = await response.json();
            if (data.filePath) {
              setValue("thumbnail", data.filePath);
            }
          }
        }} className="w-full p-2 rounded bg-gray-200 dark:bg-gray-700" />
        {watch("thumbnail") && <img src={watch("thumbnail")} alt="Preview" className="mt-2 h-32" />}
        {errors.thumbnail && <p className="text-red-500 text-sm mt-1">Başlık görseli zorunludur.</p>}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium mb-1">Kısa Açıklama</label>
        <textarea {...register("description")} id="description" rows={3} className="w-full p-2 rounded bg-gray-200 dark:bg-gray-700" />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Yazı İçeriği</label>
        <Editor
          value={content}
          onChange={handleEditorChange}
          onImageUpload={onImageUpload}
          renderHTML={text => mdParser.render(text)}
          className="h-96"
        />
      </div>

      <div className="text-right">
        <button type="submit" disabled={isSubmitting} className="bg-brand-primary text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-400">
          {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
        </button>
      </div>
    </form>
  );
}