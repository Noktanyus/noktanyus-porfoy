"use client";

import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { LiveProject } from "@/types/content";
import { useEffect, useState } from "react";
import MarkdownIt from 'markdown-it';
import Editor from 'react-markdown-editor-lite';
import 'react-markdown-editor-lite/lib/index.css';

const mdParser = new MarkdownIt();

type LiveProjectFormData = Omit<LiveProject, 'id' | 'contentHtml'>;

interface LiveProjectFormProps {
  post?: LiveProject;
  slug?: string;
}

export default function LiveProjectForm({ post, slug }: LiveProjectFormProps) {
  const router = useRouter();
  const { register, handleSubmit, setValue, watch, formState: { isSubmitting, errors } } = useForm<LiveProjectFormData>();
  const [content, setContent] = useState("");
  const isEditMode = !!post;

  useEffect(() => {
    if (isEditMode && post) {
      Object.keys(post).forEach(key => {
        const postKey = key as keyof LiveProjectFormData;
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

  const onImageUpload = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Yükleme başarısız");
      }

      const { filePath } = await response.json();
      toast.success("Resim başarıyla yüklendi!");
      return filePath;
    } catch (error) {
      toast.error(`Resim yüklenemedi: ${(error as Error).message}`);
      throw error;
    }
  };

  const onSubmit = async (data: LiveProjectFormData) => {
    const loadingToast = toast.loading(isEditMode ? "Güncelleniyor..." : "Oluşturuluyor...");
    const finalSlug = (slug || data.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '')) + ".md";

    try {
      const response = await fetch('/api/admin/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'canli-projeler',
          slug: finalSlug,
          data: data,
          content: content
        }),
      });

      if (!response.ok) throw new Error("İşlem başarısız oldu.");

      toast.success(isEditMode ? "Güncellendi!" : "Oluşturuldu!", { id: loadingToast });
      router.push('/admin/live-projects');
      router.refresh();
    } catch (error) {
      toast.error((error as Error).message, { id: loadingToast });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label htmlFor="title" className="block text-sm font-medium mb-1">Proje Başlığı</label>
        <input {...register("title", { required: "Başlık zorunludur." })} id="title" className="w-full p-2 rounded bg-gray-200 dark:bg-gray-700" />
        {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message as string}</p>}
      </div>
      
      <div>
        <label htmlFor="thumbnail" className="block text-sm font-medium mb-1">Proje Görseli</label>
        <input type="file" id="thumbnail" onChange={async (e) => {
          if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const url = await onImageUpload(file);
            setValue("thumbnail", url);
          }
        }} className="w-full p-2 rounded bg-gray-200 dark:bg-gray-700" />
        {watch("thumbnail") && <img src={watch("thumbnail")} alt="Preview" className="mt-2 h-32" />}
        {errors.thumbnail && <p className="text-red-500 text-sm mt-1">{errors.thumbnail.message as string}</p>}
      </div>

      <div>
        <label htmlFor="url" className="block text-sm font-medium mb-1">Canlı Demo URL</label>
        <input {...register("url", { required: "Canlı demo URL zorunludur." })} id="url" className="w-full p-2 rounded bg-gray-200 dark:bg-gray-700" />
        {errors.url && <p className="text-red-500 text-sm mt-1">{errors.url.message as string}</p>}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium mb-1">Kısa Açıklama</label>
        <textarea {...register("description")} id="description" rows={3} className="w-full p-2 rounded bg-gray-200 dark:bg-gray-700" />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Proje İçeriği</label>
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
