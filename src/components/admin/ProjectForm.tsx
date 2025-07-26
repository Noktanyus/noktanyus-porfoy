"use client";

import { useForm, Controller } from "react-hook-form";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Project } from "@/types/content";
import { useEffect, useRef } from "react";
import MarkdownIt from 'markdown-it';
import dynamic from 'next/dynamic';
import 'react-markdown-editor-lite/lib/index.css';
import { ErrorMessage } from "@hookform/error-message";
import ImageUpload from "./ImageUpload";

// Markdown editörünü sadece client tarafında ve ihtiyaç anında yükle
const Editor = dynamic(() => import('react-markdown-editor-lite'), { 
  ssr: false,
  loading: () => <div className="h-96 w-full bg-gray-100 dark:bg-gray-800 animate-pulse rounded-lg flex items-center justify-center">Editör Yükleniyor...</div>
});

type ProjectFormData = Omit<Project, 'id' | 'contentHtml' | 'technologies'> & {
  technologies: string;
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
    formState: { isSubmitting, errors, isDirty } 
  } = useForm<ProjectFormData>({
    criteriaMode: "all",
    defaultValues: {
      title: project?.title || '',
      slug: project?.slug || '',
      description: project?.description || '',
      mainImage: project?.mainImage || '',
      technologies: Array.isArray(project?.technologies) ? project.technologies.join(', ') : (project?.technologies || ''),
      liveDemo: project?.liveDemo || '',
      githubRepo: project?.githubRepo || '',
      order: project?.order || 0,
      featured: project?.featured || false,
      isLive: project?.isLive || false,
      content: project?.content || '', // İçeriği de form state'ine ekle
    }
  });

  // `project` prop'u değiştiğinde formu sıfırla
  useEffect(() => {
    if (project) {
      setValue('title', project.title);
      setValue('slug', project.slug);
      setValue('description', project.description);
      setValue('mainImage', project.mainImage);
      setValue('technologies', Array.isArray(project.technologies) ? project.technologies.join(', ') : (project.technologies || ''));
      setValue('liveDemo', project.liveDemo || '');
      setValue('githubRepo', project.githubRepo || '');
      setValue('order', project.order || 0);
      setValue('featured', project.featured || false);
      setValue('isLive', project.isLive || false);
      setValue('content', project.content || '');
    }
  }, [project, setValue]);
  
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
          content: data.content, // content'i form verisinden al
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
    <form onSubmit={handleSubmit(onSubmit)} className="admin-content-spacing">
      <div className="admin-form-grid">
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-2">Proje Başlığı</label>
          <input {...register("title", { required: "Başlık zorunludur." })} id="title" className="admin-input" />
          <ErrorMessage errors={errors} name="title" render={({ message }) => <p className="text-red-500 text-sm mt-1">{message}</p>} />
        </div>
        <div>
          <label htmlFor="slug" className="block text-sm font-medium mb-2">Slug</label>
          <input {...register("slug", { required: "Slug zorunludur." })} id="slug" className="admin-input" />
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
        <label htmlFor="description" className="block text-sm font-medium mb-2">Kısa Açıklama</label>
        <textarea {...register("description", { required: "Açıklama zorunludur." })} id="description" rows={3} className="admin-input resize-y min-h-[80px]" />
        <ErrorMessage errors={errors} name="description" render={({ message }) => <p className="text-red-500 text-sm mt-1">{message}</p>} />
      </div>

      <div>
        <label htmlFor="technologies" className="block text-sm font-medium mb-2">Kullanılan Teknolojiler (Virgülle Ayırın)</label>
        <input {...register("technologies", { required: "Teknolojiler zorunludur." })} id="technologies" className="admin-input" placeholder="React, TypeScript, Node.js" />
        <ErrorMessage errors={errors} name="technologies" render={({ message }) => <p className="text-red-500 text-sm mt-1">{message}</p>} />
      </div>

      <div className="admin-form-grid">
        <div>
          <label htmlFor="liveDemo" className="block text-sm font-medium mb-2">Canlı Demo Linki</label>
          <input {...register("liveDemo")} id="liveDemo" className="admin-input" placeholder="https://example.com" />
        </div>
        <div>
          <label htmlFor="githubRepo" className="block text-sm font-medium mb-2">GitHub Repo Linki</label>
          <input {...register("githubRepo")} id="githubRepo" className="admin-input" placeholder="https://github.com/user/repo" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <div>
          <label htmlFor="order" className="block text-sm font-medium mb-2">Sıralama Önceliği</label>
          <input type="number" {...register("order", { required: "Sıra zorunludur.", valueAsNumber: true })} id="order" className="admin-input" />
          <ErrorMessage errors={errors} name="order" render={({ message }) => <p className="text-red-500 text-sm mt-1">{message}</p>} />
        </div>
        <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <input type="checkbox" {...register("featured")} id="featured" className="h-5 w-5 rounded border-gray-300 text-brand-primary focus:ring-brand-primary" />
          <label htmlFor="featured" className="text-sm font-medium cursor-pointer">Öne Çıkarılsın mı?</label>
        </div>
        <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <input type="checkbox" {...register("isLive")} id="isLive" className="h-5 w-5 rounded border-gray-300 text-brand-primary focus:ring-brand-primary" />
          <label htmlFor="isLive" className="text-sm font-medium cursor-pointer">Canlı Proje mi?</label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Proje Detayları (İçerik)</label>
        <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
          <Controller
            name="content"
            control={control}
            render={({ field }) => (
              <Editor
                key={project?.slug || 'new-project'}
                defaultValue={field.value}
                renderHTML={text => mdParser.render(text)}
                onChange={({ text }) => field.onChange(text)}
                onImageUpload={onEditorImageUpload}
                className="h-80 sm:h-96"
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
          {isSubmitting ? "Kaydediliyor..." : (isEditMode ? "Değişiklikleri Kaydet" : "Proje Oluştur")}
        </button>
      </div>
    </form>
  );
}
