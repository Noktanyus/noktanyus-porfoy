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
import { useEffect, useState } from "react";
import * as React from 'react';
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
      tags: Array.isArray(post?.tags) ? post.tags.join(', ') : (typeof post?.tags === 'string' ? post.tags : ''),
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
      setValue('tags', Array.isArray(post.tags) ? post.tags.join(', ') : (typeof post.tags === 'string' ? post.tags : ''));
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
   * AI ile blog yazısı üretir. Modal benzeri inline prompt ile çalışır.
   * Üretilen içerik doğrudan content editörüne yazılır.
   */
  const [aiOpen, setAiOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiTone, setAiTone] = useState<'professional' | 'casual' | 'technical' | 'friendly'>('professional');
  const [aiLength, setAiLength] = useState<'short' | 'medium' | 'long'>('medium');

  const handleAiGenerate = async () => {
    if (!aiPrompt || aiPrompt.length < 10) {
      toast.error('Konu en az 10 karakter olmalı');
      return;
    }
    setAiLoading(true);
    const loadingId = toast.loading('AI yazıyı oluşturuyor...');
    try {
      const response = await fetch('/api/admin/blog/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: aiPrompt,
          tone: aiTone,
          length: aiLength,
          language: 'tr',
          existingTitle: watch('title') || undefined,
          existingDescription: watch('description') || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error?.message ?? 'AI yanıtı alınamadı');
      }

      const { title, description, content, tags, mock, tokensUsed } = data.data;
      setValue('title', title, { shouldDirty: true, shouldValidate: true });
      setValue('description', description, { shouldDirty: true, shouldValidate: true });
      setValue('content', content, { shouldDirty: true, shouldValidate: true });
      if (Array.isArray(tags) && tags.length > 0) {
        setValue('tags', tags.join(', '), { shouldDirty: true });
      }
      toast.success(
        mock
          ? 'AI mock içerik oluşturdu (ANTHROPIC_API_KEY tanımlı değil)'
          : `AI içerik oluşturdu (${tokensUsed.total} token)`,
        { id: loadingId }
      );
      setAiOpen(false);
    } catch (error) {
      toast.error(`AI hatası: ${(error as Error).message}`, { id: loadingId });
    } finally {
      setAiLoading(false);
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
          <input {...register("title", { required: "Başlık zorunludur." })} id="title" aria-invalid={errors.title ? "true" : "false"} className="admin-input" />
          <ErrorMessage errors={errors} name="title" render={({ message }) => <p className="text-rose-600 dark:text-rose-400 text-sm mt-1" role="alert">{message}</p>} />
        </div>
        <div>
          <label htmlFor="slug" className="block text-sm font-medium mb-2">Kimlik (Slug)</label>
          <input {...register("slug", { required: "Slug zorunludur." })} id="slug" aria-invalid={errors.slug ? "true" : "false"} className="admin-input" />
          <ErrorMessage errors={errors} name="slug" render={({ message }) => <p className="text-rose-600 dark:text-rose-400 text-sm mt-1" role="alert">{message}</p>} />
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
        <textarea {...register("description", { required: "Açıklama zorunludur." })} id="description" aria-invalid={errors.description ? "true" : "false"} rows={3} className="admin-input resize-y min-h-[80px]" />
        <ErrorMessage errors={errors} name="description" render={({ message }) => <p className="text-rose-600 dark:text-rose-400 text-sm mt-1" role="alert">{message}</p>} />
      </div>

      <div className="admin-form-grid">
        <div>
          <label htmlFor="author" className="block text-sm font-medium mb-2">Yazar</label>
          <input {...register("author", { required: "Yazar zorunludur." })} id="author" aria-invalid={errors.author ? "true" : "false"} className="admin-input" readOnly />
          <ErrorMessage errors={errors} name="author" render={({ message }) => <p className="text-rose-600 dark:text-rose-400 text-sm mt-1" role="alert">{message}</p>} />
        </div>
        <div>
          <label htmlFor="category" className="block text-sm font-medium mb-2">Kategori</label>
          <input {...register("category", { required: "Kategori zorunludur." })} id="category" aria-invalid={errors.category ? "true" : "false"} className="admin-input" />
          <ErrorMessage errors={errors} name="category" render={({ message }) => <p className="text-rose-600 dark:text-rose-400 text-sm mt-1" role="alert">{message}</p>} />
        </div>
      </div>

      <div>
        <label htmlFor="tags" className="block text-sm font-medium mb-2">Etiketler (Virgülle Ayırın)</label>
        <input {...register("tags")} id="tags" className="admin-input" placeholder="React, JavaScript, Web Development" />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium">Yazı İçeriği (Markdown)</label>
          <button
            type="button"
            onClick={() => setAiOpen(!aiOpen)}
            className="inline-flex items-center gap-2 px-3 py-1.5 min-h-[44px] text-sm rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:from-purple-600 hover:to-indigo-600 transition-all shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
            aria-label="AI ile yaz"
            aria-expanded={aiOpen}
          >
            <span aria-hidden="true">✨</span>
            <span>AI ile Yaz</span>
          </button>
        </div>

        {aiOpen && (
          <div className="mb-3 p-4 border border-purple-200 dark:border-purple-800 rounded-lg bg-purple-50/50 dark:bg-purple-950/30">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-3">
                <label htmlFor="ai-prompt" className="block text-sm font-medium mb-1">Konu / Prompt</label>
                <textarea
                  id="ai-prompt"
                  rows={2}
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="örn: Next.js 14 ile SaaS uygulaması geliştirme"
                  className="admin-input resize-y min-h-[60px]"
                />
              </div>
              <div>
                <label htmlFor="ai-tone" className="block text-sm font-medium mb-1">Ton</label>
                <select
                  id="ai-tone"
                  value={aiTone}
                  onChange={(e) => setAiTone(e.target.value as typeof aiTone)}
                  className="admin-input"
                >
                  <option value="professional">Profesyonel</option>
                  <option value="casual">Günlük</option>
                  <option value="technical">Teknik</option>
                  <option value="friendly">Samimi</option>
                </select>
              </div>
              <div>
                <label htmlFor="ai-length" className="block text-sm font-medium mb-1">Uzunluk</label>
                <select
                  id="ai-length"
                  value={aiLength}
                  onChange={(e) => setAiLength(e.target.value as typeof aiLength)}
                  className="admin-input"
                >
                  <option value="short">Kısa (~400 kelime)</option>
                  <option value="medium">Orta (~1000 kelime)</option>
                  <option value="long">Uzun (~2000+ kelime)</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleAiGenerate}
                  disabled={aiLoading}
                  aria-busy={aiLoading}
                  className="admin-btn admin-btn-primary w-full"
                >
                  {aiLoading ? 'Oluşturuluyor...' : 'Üret'}
                </button>
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              AI ile üretilen içerik mevcut başlık/açıklamanız varsa onları korur. ANTHROPIC_API_KEY tanımlı değilse mock içerik döner.
            </p>
          </div>
        )}

        <div className="border border-slate-300 dark:border-slate-600 rounded-lg overflow-hidden">
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
          className="admin-btn admin-btn-secondary order-2 sm:order-1"
        >
          İptal
        </button>
        <button
          type="submit"
          disabled={!isDirty || isSubmitting}
          aria-busy={isSubmitting}
          className="admin-btn admin-btn-primary order-1 sm:order-2"
        >
          {isSubmitting ? "Kaydediliyor..." : (isEditMode ? "Değişiklikleri Kaydet" : "Yazıyı Oluştur")}
        </button>
      </div>
    </form>
  );
}
