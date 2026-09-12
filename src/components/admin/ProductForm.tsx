/**
 * @file Admin ürün formu — Sprint 1: AI Description entegrasyonlu
 * @description Yeni ürün oluşturma ve düzenleme. AI ile description üretme butonu içerir.
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import type { DigitalProduct } from '@prisma/client';

type ProductFormData = Pick<
  DigitalProduct,
  'title' | 'slug' | 'shortDescription' | 'description' | 'thumbnail' | 'fileUrl' | 'fileName' | 'fileSize' | 'priceCents' | 'currency' | 'category' | 'version' | 'downloadCountMax' | 'ttlHours' | 'active' | 'featured' | 'order'
> & {
  features: string;
};

interface ProductFormProps {
  product?: DigitalProduct;
}

export default function ProductForm({ product }: ProductFormProps) {
  const router = useRouter();
  const isEditMode = !!product;
  const [aiOpen, setAiOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiProductName, setAiProductName] = useState('');
  const [aiFeatures, setAiFeatures] = useState('');
  const [aiVariant, setAiVariant] = useState<'short' | 'medium' | 'long'>('medium');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { isSubmitting, errors, isDirty },
  } = useForm<ProductFormData>({
    defaultValues: {
      title: product?.title ?? '',
      slug: product?.slug ?? '',
      shortDescription: product?.shortDescription ?? '',
      description: product?.description ?? '',
      thumbnail: product?.thumbnail ?? '',
      fileUrl: product?.fileUrl ?? '',
      fileName: product?.fileName ?? '',
      fileSize: product?.fileSize ?? 0,
      priceCents: product?.priceCents ?? 0,
      currency: product?.currency ?? 'try',
      category: product?.category ?? 'general',
      version: product?.version ?? '',
      downloadCountMax: product?.downloadCountMax ?? 5,
      ttlHours: product?.ttlHours ?? 72,
      active: product?.active ?? true,
      featured: product?.featured ?? false,
      order: product?.order ?? 0,
      features: '',
    },
  });

  const title = watch('title');

  // Slug otomatik üretimi (sadece yeni ürün modunda)
  if (typeof window !== 'undefined') {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useState(() => {
      // Basit yaklaşım: title değişince slug üret (manuel override edilene kadar)
      return null;
    });
  }

  const generateSlug = (text: string) =>
    text
      .toLowerCase()
      .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

  const onTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    if (!isEditMode) {
      setValue('slug', generateSlug(newTitle));
    }
  };

  const handleAiDescribe = async () => {
    if (!aiProductName || !aiFeatures) {
      toast.error('Ürün adı ve en az bir özellik gerekli');
      return;
    }
    setAiLoading(true);
    const loadingId = toast.loading('AI açıklama oluşturuyor...');
    try {
      const featuresArray = aiFeatures.split(',').map((f) => f.trim()).filter(Boolean);
      const response = await fetch('/api/admin/products/ai-generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: aiProductName,
          features: featuresArray,
          variant: aiVariant,
          language: 'tr',
          existingShortDescription: watch('shortDescription') || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error?.message ?? 'AI yanıtı alınamadı');
      }

      const { shortDescription, description, mock, tokensUsed } = data.data;
      setValue('shortDescription', shortDescription, { shouldDirty: true });
      setValue('description', description, { shouldDirty: true });
      toast.success(
        mock
          ? 'AI mock açıklama oluşturdu (ANTHROPIC_API_KEY tanımlı değil)'
          : `AI açıklama oluşturdu (${tokensUsed.total} token)`,
        { id: loadingId }
      );
      setAiOpen(false);
    } catch (error) {
      toast.error(`AI hatası: ${(error as Error).message}`, { id: loadingId });
    } finally {
      setAiLoading(false);
    }
  };

  const onSubmit = async (data: ProductFormData) => {
    const loadingId = toast.loading(isEditMode ? 'Ürün güncelleniyor...' : 'Ürün oluşturuluyor...');
    try {
      const payload = {
        title: data.title,
        slug: data.slug,
        shortDescription: data.shortDescription,
        description: data.description,
        thumbnail: data.thumbnail || null,
        fileUrl: data.fileUrl,
        fileName: data.fileName,
        fileSize: Number(data.fileSize) || 0,
        priceCents: Number(data.priceCents) || 0,
        currency: data.currency,
        category: data.category,
        version: data.version || null,
        downloadCountMax: Number(data.downloadCountMax) || 5,
        ttlHours: Number(data.ttlHours) || 72,
        active: data.active,
        featured: data.featured,
        order: Number(data.order) || 0,
      };

      const url = isEditMode ? `/api/admin/products/${product.id}` : '/api/admin/products';
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error?.message ?? 'İşlem başarısız oldu');
      }

      toast.success(isEditMode ? 'Ürün güncellendi!' : 'Ürün oluşturuldu!', { id: loadingId });
      router.push('/admin/products');
      router.refresh();
    } catch (error) {
      toast.error((error as Error).message, { id: loadingId });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-2">Ürün Başlığı *</label>
          <input
            {...register('title', { required: 'Başlık zorunludur' })}
            id="title"
            onChange={(e) => {
              register('title').onChange(e);
              onTitleChange(e);
            }}
            className="admin-input"
          />
          {errors.title && <p role="alert" className="text-rose-600 dark:text-rose-400 text-sm mt-1">{errors.title.message}</p>}
        </div>
        <div>
          <label htmlFor="slug" className="block text-sm font-medium mb-2">Slug *</label>
          <input {...register('slug', { required: 'Slug zorunludur' })} id="slug" className="admin-input" />
          {errors.slug && <p role="alert" className="text-rose-600 dark:text-rose-400 text-sm mt-1">{errors.slug.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div>
          <label htmlFor="priceCents" className="block text-sm font-medium mb-2">Fiyat (kuruş) *</label>
          <input
            type="number"
            {...register('priceCents', { required: 'Fiyat zorunludur', valueAsNumber: true, min: 0 })}
            id="priceCents"
            className="admin-input"
          />
        </div>
        <div>
          <label htmlFor="currency" className="block text-sm font-medium mb-2">Para Birimi</label>
          <select {...register('currency')} id="currency" className="admin-input">
            <option value="try">TRY</option>
            <option value="usd">USD</option>
            <option value="eur">EUR</option>
            <option value="gbp">GBP</option>
          </select>
        </div>
      </div>

      {/* AI Description */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium">Açıklamalar</label>
          <button
            type="button"
            onClick={() => setAiOpen(!aiOpen)}
            className="inline-flex items-center gap-2 px-3 py-1.5 min-h-[44px] text-sm rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:from-purple-600 hover:to-indigo-600 transition-all shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
            aria-expanded={aiOpen}
            aria-label="AI ile açıklama oluştur"
          >
            <span aria-hidden="true">✨</span>
            <span>AI ile Açıklama Oluştur</span>
          </button>
        </div>

        {aiOpen && (
          <div className="mb-3 p-4 border border-purple-200 dark:border-purple-800 rounded-lg bg-purple-50/50 dark:bg-purple-950/30">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label htmlFor="ai-product-name" className="block text-sm font-medium mb-1">Ürün adı</label>
                <input
                  id="ai-product-name"
                  value={aiProductName}
                  onChange={(e) => setAiProductName(e.target.value)}
                  placeholder="örn: Next.js SaaS Starter"
                  className="admin-input"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="ai-features" className="block text-sm font-medium mb-1">Özellikler (virgülle)</label>
                <input
                  id="ai-features"
                  value={aiFeatures}
                  onChange={(e) => setAiFeatures(e.target.value)}
                  placeholder="örn: TypeScript, Prisma, Auth, Stripe"
                  className="admin-input"
                />
              </div>
              <div>
                <label htmlFor="ai-variant" className="block text-sm font-medium mb-1">Uzunluk</label>
                <select
                  id="ai-variant"
                  value={aiVariant}
                  onChange={(e) => setAiVariant(e.target.value as typeof aiVariant)}
                  className="admin-input"
                >
                  <option value="short">Kısa</option>
                  <option value="medium">Orta</option>
                  <option value="long">Uzun</option>
                </select>
              </div>
              <div className="sm:col-span-2 flex items-end">
                <button
                  type="button"
                  onClick={handleAiDescribe}
                  disabled={aiLoading}
                  aria-busy={aiLoading}
                  className="admin-btn admin-btn-primary w-full"
                >
                  {aiLoading ? 'Oluşturuluyor...' : 'Açıklama Üret'}
                </button>
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              AI ile üretilen içerik mevcut kısa açıklamayı korur. ANTHROPIC_API_KEY tanımlı değilse mock içerik döner.
            </p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor="shortDescription" className="block text-sm font-medium mb-2">Kısa Açıklama (10-300 karakter) *</label>
            <textarea
              {...register('shortDescription', { required: 'Kısa açıklama zorunludur', minLength: 10, maxLength: 300 })}
              id="shortDescription"
              rows={2}
              className="admin-input resize-y min-h-[60px]"
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-2">Detaylı Açıklama (min 50 karakter) *</label>
            <textarea
              {...register('description', { required: 'Açıklama zorunludur', minLength: 50 })}
              id="description"
              rows={8}
              className="admin-input resize-y min-h-[160px]"
            />
          </div>
        </div>
      </div>

      {/* File metadata */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <div>
          <label htmlFor="fileUrl" className="block text-sm font-medium mb-2">Dosya URL *</label>
          <input {...register('fileUrl', { required: 'Dosya URL zorunludur' })} id="fileUrl" className="admin-input" placeholder="r2:bucket/file.zip" />
        </div>
        <div>
          <label htmlFor="fileName" className="block text-sm font-medium mb-2">Dosya Adı *</label>
          <input {...register('fileName', { required: 'Dosya adı zorunludur' })} id="fileName" className="admin-input" />
        </div>
        <div>
          <label htmlFor="fileSize" className="block text-sm font-medium mb-2">Boyut (bytes)</label>
          <input type="number" {...register('fileSize', { valueAsNumber: true, min: 0 })} id="fileSize" className="admin-input" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <div>
          <label htmlFor="category" className="block text-sm font-medium mb-2">Kategori</label>
          <input {...register('category')} id="category" className="admin-input" placeholder="starter, saas, ..." />
        </div>
        <div>
          <label htmlFor="version" className="block text-sm font-medium mb-2">Versiyon</label>
          <input {...register('version')} id="version" className="admin-input" placeholder="1.0.0" />
        </div>
        <div>
          <label htmlFor="order" className="block text-sm font-medium mb-2">Sıralama</label>
          <input type="number" {...register('order', { valueAsNumber: true })} id="order" className="admin-input" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <div>
          <label htmlFor="downloadCountMax" className="block text-sm font-medium mb-2">İndirme Limiti</label>
          <input type="number" {...register('downloadCountMax', { valueAsNumber: true })} id="downloadCountMax" className="admin-input" />
        </div>
        <div>
          <label htmlFor="ttlHours" className="block text-sm font-medium mb-2">Link Geçerlilik (saat)</label>
          <input type="number" {...register('ttlHours', { valueAsNumber: true })} id="ttlHours" className="admin-input" />
        </div>
        <div className="flex items-center gap-4 pt-6">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register('active')} className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-indigo-600 dark:text-indigo-400 focus-visible:ring-2 focus-visible:ring-indigo-500" />
            <span>Aktif</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register('featured')} className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-indigo-600 dark:text-indigo-400 focus-visible:ring-2 focus-visible:ring-indigo-500" />
            <span>Öne Çıkan</span>
          </label>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
        <button type="button" onClick={() => router.back()} className="admin-btn admin-btn-secondary order-2 sm:order-1">
          İptal
        </button>
        <button type="submit" disabled={!isDirty || isSubmitting} aria-busy={isSubmitting} className="admin-btn admin-btn-primary order-1 sm:order-2">
          {isSubmitting ? 'Kaydediliyor...' : isEditMode ? 'Değişiklikleri Kaydet' : 'Ürün Oluştur'}
        </button>
      </div>
    </form>
  );
}
