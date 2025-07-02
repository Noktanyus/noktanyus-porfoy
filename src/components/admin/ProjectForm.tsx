"use client";

import { useForm, Controller } from "react-hook-form";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Project } from "@/types/content";
import { useEffect, useRef } from "react";
import MarkdownIt from 'markdown-it';
import Editor from 'react-markdown-editor-lite';
import 'react-markdown-editor-lite/lib/index.css';
import { ErrorMessage } from "@hookform/error-message";
import ImageUpload from "./ImageUpload"; // Standart ImageUpload bileşenini import et

type ProjectFormData = Omit<Project, 'id' | 'contentHtml' | 'technologies'> & {
  technologies: string; // Formda teknolojileri string olarak alacağız
};

interface ProjectFormProps {
  project?: Project;
}

const mdParser = new MarkdownIt();

export default function ProjectForm({ project }: ProjectFormProps) {
  const router = useRouter();
  const isEditMode = !!project;
  
  const { 
    register, 
    handleSubmit, 
    setValue, 
    watch, 
    control,
    formState: { isSubmitting, errors } 
  } = useForm<ProjectFormData>({
    criteriaMode: "all",
    defaultValues: {
      title: project?.title || '',
      slug: project?.slug || '',
      description: project?.description || '',
      mainImage: project?.mainImage || '',
      technologies: (project?.technologies || []).join(', '),
      liveDemo: project?.liveDemo || '',
      githubRepo: project?.githubRepo || '',
      order: project?.order || 0,
      featured: project?.featured || false,
      isLive: project?.isLive || false,
    }
  });
  
  const contentRef = useRef(project?.content || "");
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
      return data.url; // API'den gelen 'url'i döndür
    } catch (error) {
      toast.error(`Görsel yüklenemedi: ${(error as Error).message}`, { id: loadingToast });
      return '';
    }
  };

  const onSubmit = async (data: ProjectFormData) => {
    const loadingToast = toast.loading(isEditMode ? "Proje güncelleniyor..." : "Proje oluşturuluyor...");
    
    const technologies = data.technologies.split(',').map(tech => tech.trim()).filter(Boolean);

    try {
      const response = await fetch('/api/admin/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'projects',
          slug: data.slug,
          originalSlug: isEditMode ? project?.slug : undefined,
          data: { ...data, technologies },
          content: contentRef.current,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "İşlem başarısız oldu.");
      }

      toast.success(isEditMode ? "Proje güncellendi!" : "Proje oluşturuldu!", { id: loadingToast });
      router.push('/admin/projects');
      router.refresh();
    } catch (error) {
      toast.error((error as Error).message, { id: loadingToast });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-1">Proje Başlığı</label>
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
          name="mainImage"
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

      <div>
        <label htmlFor="technologies" className="block text-sm font-medium mb-1">Kullanılan Teknolojiler (Virgülle Ayırın)</label>
        <input {...register("technologies", { required: "Teknolojiler zorunludur." })} id="technologies" className="w-full p-2 rounded bg-gray-200 dark:bg-gray-700" />
        <ErrorMessage errors={errors} name="technologies" render={({ message }) => <p className="text-red-500 text-sm mt-1">{message}</p>} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="liveDemo" className="block text-sm font-medium mb-1">Canlı Demo Linki</label>
          <input {...register("liveDemo")} id="liveDemo" className="w-full p-2 rounded bg-gray-200 dark:bg-gray-700" />
        </div>
        <div>
          <label htmlFor="githubRepo" className="block text-sm font-medium mb-1">GitHub Repo Linki</label>
          <input {...register("githubRepo")} id="githubRepo" className="w-full p-2 rounded bg-gray-200 dark:bg-gray-700" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label htmlFor="order" className="block text-sm font-medium mb-1">Sıralama Önceliği</label>
          <input type="number" {...register("order", { required: "Sıra zorunludur.", valueAsNumber: true })} id="order" className="w-full p-2 rounded bg-gray-200 dark:bg-gray-700" />
          <ErrorMessage errors={errors} name="order" render={({ message }) => <p className="text-red-500 text-sm mt-1">{message}</p>} />
        </div>
        <div className="flex items-center pt-6">
          <input type="checkbox" {...register("featured")} id="featured" className="h-5 w-5 rounded" />
          <label htmlFor="featured" className="ml-2">Öne Çıkarılsın mı?</label>
        </div>
        <div className="flex items-center pt-6">
          <input type="checkbox" {...register("isLive")} id="isLive" className="h-5 w-5 rounded" />
          <label htmlFor="isLive" className="ml-2">Canlı Proje mi?</label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Proje Detayları (İçerik)</label>
        <Editor
          key={project?.slug || 'new-project'}
          defaultValue={contentRef.current}
          renderHTML={text => mdParser.render(text)}
          onChange={({ text }) => { contentRef.current = text; }}
          onImageUpload={onEditorImageUpload}
          className="h-96"
        />
      </div>
      <div className="text-right">
        <button type="submit" disabled={isSubmitting} className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-400">
          {isSubmitting ? "Kaydediliyor..." : (isEditMode ? "Değişiklikleri Kaydet" : "Proje Oluştur")}
        </button>
      </div>
    </form>
  );
}
