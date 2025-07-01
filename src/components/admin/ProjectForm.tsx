"use client";

"use client";

import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Project } from "@/types/content";
import { useEffect, useState } from "react";
import MarkdownIt from 'markdown-it';
import Editor from 'react-markdown-editor-lite';
import 'react-markdown-editor-lite/lib/index.css';

type ProjectFormData = Omit<Project, 'id' | 'contentHtml'>;

interface ProjectFormProps {
  project?: Project; // Düzenleme modu için mevcut proje verisi
  slug?: string;
}

const mdParser = new MarkdownIt(/* Markdown-it options */);

export default function ProjectForm({ project, slug }: ProjectFormProps) {
  const router = useRouter();
  const { register, handleSubmit, setValue, watch, formState: { isSubmitting, errors } } = useForm<ProjectFormData>();
  const isEditMode = !!project;
  const [markdownContent, setMarkdownContent] = useState(project?.content || "");

  const title = watch("title");

  useEffect(() => {
    if (isEditMode && project) {
      Object.keys(project).forEach(key => {
        const projectKey = key as keyof ProjectFormData;
        if (projectKey in project) {
            setValue(projectKey as any, project[projectKey]);
        }
      });
      setMarkdownContent(project.content || "");
    }
  }, [isEditMode, project, setValue]);

  useEffect(() => {
    if (title && !isEditMode) {
      setValue("slug", title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, ''));
    }
  }, [title, setValue, isEditMode]);

  const handleEditorChange = ({ html, text }: { html: string, text: string }) => {
    setMarkdownContent(text);
  };

  const onImageUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Image upload failed.');
      }

      const data = await response.json();
      return data.imageUrl; // Return the URL of the uploaded image
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Resim yüklenirken bir hata oluştu.');
      return '';
    }
  };

  const onSubmit = async (data: ProjectFormData) => {
    const loadingToast = toast.loading(isEditMode ? "Proje g��ncelleniyor..." : "Proje oluşturuluyor...");
    
    const finalSlug = (slug || data.slug || data.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, ''));

    try {
      const response = await fetch('/api/admin/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'projects',
          slug: finalSlug + ".md",
          originalSlug: isEditMode ? project.slug : undefined,
          data: {
            ...data,
            mainImage: data.mainImage, // Görsel URL'sini ekle
            slug: finalSlug,
            technologies: Array.isArray(data.technologies) ? data.technologies : data.technologies.split(',').map((tech: string) => tech.trim()),
          },
          content: markdownContent,
        }),
      });

      if (!response.ok) throw new Error("İşlem başarısız oldu.");

      toast.success(isEditMode ? "Proje güncellendi!" : "Proje oluşturuldu!", { id: loadingToast });
      router.push('/admin/projects'); // Proje listesine yönlendir
      router.refresh(); // Sayfanın yeniden render edilmesini sağla
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
        <label htmlFor="slug" className="block text-sm font-medium mb-1">Slug (Otomatik Oluşturulur)</label>
        <input {...register("slug", { required: "Slug zorunludur." })} id="slug" className="w-full p-2 rounded bg-gray-200 dark:bg-gray-700" readOnly={!isEditMode} />
        {errors.slug && <p className="text-red-500 text-sm mt-1">{errors.slug.message as string}</p>}
      </div>

      <div>
        <label htmlFor="mainImage" className="block text-sm font-medium mb-1">Başlık Görseli</label>
        <input type="file" id="mainImage" onChange={async (e) => {
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
              setValue("mainImage", data.filePath);
            }
          }
        }} className="w-full p-2 rounded bg-gray-200 dark:bg-gray-700" />
        {watch("mainImage") && <img src={watch("mainImage")} alt="Preview" className="mt-2 h-32" />}
        {errors.mainImage && <p className="text-red-500 text-sm mt-1">{errors.mainImage.message as string}</p>}
      </div>
      
      <div>
        <label htmlFor="description" className="block text-sm font-medium mb-1">Kısa Açıklama</label>
        <textarea {...register("description", { required: "Açıklama zorunludur." })} id="description" rows={3} className="w-full p-2 rounded bg-gray-200 dark:bg-gray-700" />
        {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description.message as string}</p>}
      </div>

      <div>
        <label htmlFor="technologies" className="block text-sm font-medium mb-1">Kullanılan Teknolojiler (Virgülle Ayırın)</label>
        <input {...register("technologies", { 
          required: "Teknolojiler zorunludur.",
          setValueAs: (value: any) => typeof value === 'string' ? value.split(',').map(s => s.trim()).filter(s => s.length > 0) : []
        })} id="technologies" className="w-full p-2 rounded bg-gray-200 dark:bg-gray-700" />
        {errors.technologies && <p className="text-red-500 text-sm mt-1">{errors.technologies.message as string}</p>}
      </div>

      <div>
        <label htmlFor="liveDemo" className="block text-sm font-medium mb-1">Canlı Demo Linki (Opsiyonel)</label>
        <input {...register("liveDemo")} id="liveDemo" className="w-full p-2 rounded bg-gray-200 dark:bg-gray-700" />
      </div>

      <div>
        <label htmlFor="githubRepo" className="block text-sm font-medium mb-1">GitHub Repo Linki (Opsiyonel)</label>
        <input {...register("githubRepo")} id="githubRepo" className="w-full p-2 rounded bg-gray-200 dark:bg-gray-700" />
      </div>

      <div>
        <label htmlFor="order" className="block text-sm font-medium mb-1">Sıra Numarası</label>
        <input type="number" {...register("order", { required: "Sıra numarası zorunludur.", valueAsNumber: true })} id="order" className="w-full p-2 rounded bg-gray-200 dark:bg-gray-700" />
        {errors.order && <p className="text-red-500 text-sm mt-1">{errors.order.message as string}</p>}
      </div>

      <div className="flex items-center space-x-2">
        <input type="checkbox" {...register("featured")} id="featured" className="form-checkbox h-5 w-5 text-brand-primary" />
        <label htmlFor="featured" className="text-sm font-medium">Öne Çıkar</label>
      </div>

      <div className="flex items-center space-x-2">
        <input type="checkbox" {...register("isLive")} id="isLive" className="form-checkbox h-5 w-5 text-brand-primary" />
        <label htmlFor="isLive" className="text-sm font-medium">Canlı Proje</label>
      </div>

      <div>
        <label htmlFor="content" className="block text-sm font-medium mb-1">Proje İçeriği (Markdown)</label>
        <Editor
          value={markdownContent}
          renderHTML={text => mdParser.render(text)}
          onChange={handleEditorChange}
          onImageUpload={onImageUpload}
          className="h-96"
        />
      </div>

      <div className="text-right">
        <button type="submit" disabled={isSubmitting} className="bg-brand-primary text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-400">
          {isSubmitting ? (isEditMode ? "Güncelleniyor..." : "Oluşturuluyor...") : (isEditMode ? "Güncelle" : "Oluştur")}
        </button>
      </div>
    </form>
  );
}
