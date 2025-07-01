"use client";

import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { AboutData } from "@/types/content";
import { useEffect, useState } from "react";
import MarkdownIt from 'markdown-it';
import Editor from 'react-markdown-editor-lite';
import 'react-markdown-editor-lite/lib/index.css';

const mdParser = new MarkdownIt();

export default function HakkimdaForm({ about }: { about: AboutData }) {
  const router = useRouter();
  const { register, handleSubmit, setValue, watch, formState: { isSubmitting, errors } } = useForm<AboutData>();
  const [markdownContent, setMarkdownContent] = useState(about.content || "");

  useEffect(() => {
    if (about) {
      Object.keys(about).forEach(key => {
        const aboutKey = key as keyof AboutData;
        if (aboutKey in about) {
            setValue(aboutKey as any, about[aboutKey]);
        }
      });
      setMarkdownContent(about.content || "");
    }
  }, [about, setValue]);

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
      return data.imageUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Resim yüklenirken bir hata oluştu.');
      return '';
    }
  };

  const onSubmit = async (data: AboutData) => {
    const loadingToast = toast.loading("Bilgiler güncelleniyor...");
    
    try {
      const response = await fetch('/api/admin/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: '', // about.md is in the root of the content directory
          slug: 'about.md',
          data: data,
          content: markdownContent,
        }),
      });

      if (!response.ok) throw new Error("İşlem başarısız oldu.");

      toast.success("Bilgiler güncellendi!", { id: loadingToast });
      router.refresh();
    } catch (error) {
      toast.error((error as Error).message, { id: loadingToast });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-1">İsim Soyisim</label>
        <input {...register("name", { required: "İsim Soyisim zorunludur." })} id="name" className="w-full p-2 rounded bg-gray-200 dark:bg-gray-700" />
        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message as string}</p>}
      </div>
      
      <div>
        <label htmlFor="headerTitle" className="block text-sm font-medium mb-1">Site Başlığı (Header)</label>
        <input {...register("headerTitle", { required: "Site başlığı zorunludur." })} id="headerTitle" className="w-full p-2 rounded bg-gray-200 dark:bg-gray-700" />
        {errors.headerTitle && <p className="text-red-500 text-sm mt-1">{errors.headerTitle.message as string}</p>}
      </div>

      <div>
        <label htmlFor="title" className="block text-sm font-medium mb-1">Başlık</label>
        <input {...register("title", { required: "Başlık zorunludur." })} id="title" className="w-full p-2 rounded bg-gray-200 dark:bg-gray-700" />
        {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message as string}</p>}
      </div>

      <div>
        <label htmlFor="profileImage" className="block text-sm font-medium mb-1">Profil Resmi</label>
        <input type="file" id="profileImage" onChange={async (e) => {
          if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const formData = new FormData();
            formData.append('file', file);
            const response = await fetch('/api/admin/upload', {
              method: 'POST',
              body: formData,
            });
            const data = await response.json();
            if (data.success) {
              setValue("profileImage", data.imageUrl);
            }
          }
        }} className="w-full p-2 rounded bg-gray-200 dark:bg-gray-700" />
        {watch("profileImage") && <img src={watch("profileImage")} alt="Preview" className="mt-2 h-32" />}
        {errors.profileImage && <p className="text-red-500 text-sm mt-1">{errors.profileImage.message as string}</p>}
      </div>

      <div>
        <label htmlFor="content" className="block text-sm font-medium mb-1">İçerik (Markdown)</label>
        <Editor
          value={markdownContent}
          renderHTML={text => mdParser.render(text)}
          onChange={handleEditorChange}
          onImageUpload={onImageUpload}
          className="h-96"
        />
      </div>

      <div className="p-6 border rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Sosyal Medya Linkleri</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="social.github" className="block text-sm font-medium mb-1">GitHub</label>
            <input {...register("social.github")} id="social.github" className="w-full p-2 rounded bg-gray-200 dark:bg-gray-700" />
          </div>
          <div>
            <label htmlFor="social.linkedin" className="block text-sm font-medium mb-1">LinkedIn</label>
            <input {...register("social.linkedin")} id="social.linkedin" className="w-full p-2 rounded bg-gray-200 dark:bg-gray-700" />
          </div>
          <div>
            <label htmlFor="social.twitter" className="block text-sm font-medium mb-1">Twitter</label>
            <input {...register("social.twitter")} id="social.twitter" className="w-full p-2 rounded bg-gray-200 dark:bg-gray-700" />
          </div>
        </div>
      </div>

      <div className="text-right">
        <button type="submit" disabled={isSubmitting} className="bg-brand-primary text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-400">
          {isSubmitting ? "Güncelleniyor..." : "Güncelle"}
        </button>
      </div>
    </form>
  );
}
