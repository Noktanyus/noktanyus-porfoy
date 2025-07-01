"use client";

import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Project } from "@/types/content";
import { useEffect, useRef } from "react";
import MarkdownIt from 'markdown-it';
import Editor from 'react-markdown-editor-lite';
import 'react-markdown-editor-lite/lib/index.css';
import { ErrorMessage } from "@hookform/error-message";

type ProjectFormData = Omit<Project, 'id' | 'contentHtml'>;

interface ProjectFormProps {
  project?: Project;
}

const mdParser = new MarkdownIt();

export default function ProjectForm({ project }: ProjectFormProps) {
  const router = useRouter();
  const { register, handleSubmit, setValue, watch, formState: { isSubmitting, errors } } = useForm<ProjectFormData>({
    criteriaMode: "all"
  });
  const isEditMode = !!project;
  
  const contentRef = useRef(project?.content || "");

  const title = watch("title");

  useEffect(() => {
    if (isEditMode && project) {
      Object.entries(project).forEach(([key, value]) => {
        if (key === 'technologies' && Array.isArray(value)) {
          setValue('technologies', value.join(', '));
        } else {
          setValue(key as any, value);
        }
      });
      contentRef.current = project.content || "";
    }
  }, [isEditMode, project, setValue]);

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

  const onSubmit = async (data: ProjectFormData) => {
    const loadingToast = toast.loading(isEditMode ? "Proje güncelleniyor..." : "Proje oluşturuluyor...");
    
    const technologies = typeof data.technologies === 'string' 
      ? data.technologies.split(',').map(tech => tech.trim()).filter(Boolean) 
      : [];

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

      <div>
        <label htmlFor="mainImage" className="block text-sm font-medium mb-1">Başlık Görseli</label>
        <input 
          type="file" 
          id="mainImageFile" 
          onChange={async (e) => {
            if (e.target.files && e.target.files[0]) {
              const file = e.target.files[0];
              const formData = new FormData();
              formData.append('file', file);
              const loadingToast = toast.loading("Görsel yükleniyor...");
              try {
                const response = await fetch('/api/admin/upload', { method: 'POST', body: formData });
                if (!response.ok) throw new Error("Yükleme başarısız.");
                const data = await response.json();
                setValue("mainImage", data.filePath);
                toast.success("Görsel yüklendi!", { id: loadingToast });
              } catch (error) {
                toast.error("Görsel yüklenemedi.", { id: loadingToast });
              }
            }
          }} 
          className="w-full p-2 rounded bg-gray-200 dark:bg-gray-700" 
        />
        {watch("mainImage") && (
          <div className="mt-4">
            <p className="text-sm text-gray-500">Mevcut Görsel URL: {watch("mainImage")}</p>
            <img src={watch("mainImage")} alt="Görsel Önizleme" className="mt-2 h-32 rounded-lg" />
          </div>
        )}
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

      <div>
        <label htmlFor="liveDemo" className="block text-sm font-medium mb-1">Canlı Demo Linki</label>
        <input {...register("liveDemo")} id="liveDemo" className="w-full p-2 rounded bg-gray-200 dark:bg-gray-700" />
      </div>

      <div>
        <label htmlFor="githubRepo" className="block text-sm font-medium mb-1">GitHub Repo Linki</label>
        <input {...register("githubRepo")} id="githubRepo" className="w-full p-2 rounded bg-gray-200 dark:bg-gray-700" />
      </div>

      <div>
        <label htmlFor="order" className="block text-sm font-medium mb-1">Sıra</label>
        <input type="number" {...register("order", { required: "Sıra zorunludur.", valueAsNumber: true })} id="order" className="w-full p-2 rounded bg-gray-200 dark:bg-gray-700" />
        <ErrorMessage errors={errors} name="order" render={({ message }) => <p className="text-red-500 text-sm mt-1">{message}</p>} />
      </div>

      <div className="flex items-center space-x-2">
        <input type="checkbox" {...register("featured")} id="featured" />
        <label htmlFor="featured">Öne Çıkar</label>
      </div>

      <div className="flex items-center space-x-2">
        <input type="checkbox" {...register("isLive")} id="isLive" />
        <label htmlFor="isLive">Canlı Proje</label>
      </div>

      <div>
        <label>Proje İçeriği</label>
        <Editor
          key={project?.slug || 'new-project'}
          defaultValue={contentRef.current}
          renderHTML={text => mdParser.render(text)}
          onChange={({ text }) => { contentRef.current = text; }}
          onImageUpload={onImageUpload}
          className="h-96"
        />
      </div>
      <div className="text-right">
        <button type="submit" disabled={isSubmitting} className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-400">
          {isSubmitting ? "Kaydediliyor..." : (isEditMode ? "Güncelle" : "Oluştur")}
        </button>
      </div>
    </form>
  );
}