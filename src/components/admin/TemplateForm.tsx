/**
 * @file Admin — Template Listing Form (create + edit)
 * @description Phase 3 B.3: Admin template builder form component.
 *              Yeni template olusturma / mevcut template'i duzenleme.
 *
 *              Alanlar:
 *                - slug, name, tagline, description, longDescription (markdown)
 *                - category (select), previewImages (multi-upload)
 *                - demoUrl, priceCents, currency, licenseType (radio)
 *                - features (tag), techStack (tag), version
 *                - active (toggle, edit only)
 *
 *              Image upload: mevcut ImageUpload component'i /api/upload ile
 *              Markdown edit: Editor (react-markdown-editor-lite) — sadece
 *              istemci tarafinda dynamic import.
 *
 * Submit: POST /api/admin/templates (create) veya
 *         PATCH /api/admin/templates/[id] (edit)
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import toast from 'react-hot-toast';
import dynamic from 'next/dynamic';
import {
  FaPlus,
  FaTimes,
  FaUpload,
  FaTrash,
  FaCheckCircle,
} from 'react-icons/fa';
import {
  TEMPLATE_CATEGORIES,
  TEMPLATE_LICENSE_TYPES,
  SUPPORTED_CURRENCIES,
} from '@/modules/marketplace/templateSchemas';

// Markdown editor sadece client tarafinda yuklensin (SSR uyumsuz)
const CustomEditor = dynamic(() => import('@/components/admin/Editor'), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="animate-pulse text-gray-500">Editör yükleniyor...</div>
    </div>
  ),
});

// =================== TYPES ===================

/** TemplateListing'in server'dan gelen hali — previewImages/features/techStack JSON. */
export interface AdminTemplateFormData {
  id?: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  longDescription?: string | null;
  category: 'ecommerce' | 'saas' | 'portfolio' | 'blog';
  previewImages: string[];
  demoUrl?: string | null;
  priceCents: number;
  currency: 'USD' | 'EUR' | 'GBP' | 'TRY';
  licenseType: 'single' | 'white-label' | 'agency';
  features: string[];
  techStack: string[];
  version: string;
  active?: boolean;
  featured?: boolean;
}

interface TemplateFormProps {
  template?: AdminTemplateFormData;
}

// =================== HELPERS ===================

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === 'string');
}

function formatCurrency(cents: number, currency: string) {
  const symbol = currency === 'TRY' ? '₺' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '£';
  return `${symbol}${(cents / 100).toFixed(2)}`;
}

// =================== COMPONENT ===================

export default function TemplateForm({ template }: TemplateFormProps) {
  const router = useRouter();
  const isEditMode = !!template;

  const [uploading, setUploading] = useState(false);
  const [featureInput, setFeatureInput] = useState('');
  const [techInput, setTechInput] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { isSubmitting, errors, isDirty },
  } = useForm<AdminTemplateFormData>({
    defaultValues: {
      id: template?.id,
      slug: template?.slug ?? '',
      name: template?.name ?? '',
      tagline: template?.tagline ?? '',
      description: template?.description ?? '',
      longDescription: template?.longDescription ?? '',
      category: template?.category ?? 'saas',
      previewImages: template?.previewImages ?? [],
      demoUrl: template?.demoUrl ?? '',
      priceCents: template?.priceCents ?? 4900,
      currency: template?.currency ?? 'USD',
      licenseType: template?.licenseType ?? 'single',
      features: template?.features ?? [],
      techStack: template?.techStack ?? [],
      version: template?.version ?? '1.0.0',
      active: template?.active ?? true,
      featured: template?.featured ?? false,
    },
  });

  const name = watch('name');
  const features = watch('features');
  const techStack = watch('techStack');
  const previewImages = watch('previewImages');

  // Yeni template modunda name degistikce slug otomatik uretir
  if (!isEditMode && name && !watch('slug')) {
    setValue('slug', generateSlug(name));
  }

  // =================== IMAGE UPLOAD ===================

  const handleImageUpload = async (file: File) => {
    if (!file) return;
    setUploading(true);
    const loadingToast = toast.loading('Görsel yükleniyor...');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error?.message || data?.error || 'Yükleme başarısız');
      }
      const currentImages = watch('previewImages') ?? [];
      setValue('previewImages', [...currentImages, data.url], { shouldDirty: true });
      toast.success('Görsel yüklendi', { id: loadingToast });
    } catch (err) {
      toast.error(`Yükleme hatası: ${(err as Error).message}`, { id: loadingToast });
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (idx: number) => {
    const next = (previewImages ?? []).filter((_, i) => i !== idx);
    setValue('previewImages', next, { shouldDirty: true });
  };

  // =================== TAG INPUTS ===================

  const addFeature = () => {
    const v = featureInput.trim();
    if (!v) return;
    if (features?.includes(v)) {
      toast.error('Bu özellik zaten eklendi');
      return;
    }
    setValue('features', [...(features ?? []), v], { shouldDirty: true });
    setFeatureInput('');
  };

  const removeFeature = (idx: number) => {
    setValue(
      'features',
      (features ?? []).filter((_, i) => i !== idx),
      { shouldDirty: true }
    );
  };

  const addTech = () => {
    const v = techInput.trim();
    if (!v) return;
    if (techStack?.includes(v)) {
      toast.error('Bu teknoloji zaten eklendi');
      return;
    }
    setValue('techStack', [...(techStack ?? []), v], { shouldDirty: true });
    setTechInput('');
  };

  const removeTech = (idx: number) => {
    setValue(
      'techStack',
      (techStack ?? []).filter((_, i) => i !== idx),
      { shouldDirty: true }
    );
  };

  // =================== SUBMIT ===================

  const onSubmit = async (data: AdminTemplateFormData) => {
    const loadingId = toast.loading(isEditMode ? 'Güncelleniyor...' : 'Oluşturuluyor...');
    try {
      // longDescription icin whitespace trim
      const longDesc = data.longDescription?.trim();
      const payload = {
        slug: data.slug,
        name: data.name,
        tagline: data.tagline,
        description: data.description,
        longDescription: longDesc ? longDesc : undefined,
        category: data.category,
        previewImages: data.previewImages,
        demoUrl: data.demoUrl || undefined,
        priceCents: Number(data.priceCents) || 0,
        currency: data.currency,
        licenseType: data.licenseType,
        features: data.features,
        techStack: data.techStack,
        version: data.version,
        active: data.active,
        featured: data.featured,
      };

      const url = isEditMode ? `/api/admin/templates/${template!.id}` : '/api/admin/templates';
      const method = isEditMode ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok || result.success === false) {
        throw new Error(result?.error?.message ?? 'İşlem başarısız oldu');
      }

      toast.success(
        isEditMode ? 'Template güncellendi!' : 'Template oluşturuldu!',
        { id: loadingId }
      );
      router.push('/admin/templates');
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message, { id: loadingId });
    }
  };

  // =================== RENDER ===================

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* TEMEL BILGILER */}
      <section className="glass-card-premium p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Temel Bilgiler
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1.5">
              Template Adı *
            </label>
            <input
              id="name"
              {...register('name', { required: 'İsim zorunludur', minLength: 3 })}
              className="admin-input"
              placeholder="örn: Next.js SaaS Starter"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="slug" className="block text-sm font-medium mb-1.5">
              Slug *
            </label>
            <input
              id="slug"
              {...register('slug', {
                required: 'Slug zorunludur',
                pattern: {
                  value: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
                  message: 'Slug: küçük harf, rakam ve tire (-)',
                },
              })}
              className="admin-input"
              placeholder="next-saas-starter"
            />
            {errors.slug && (
              <p className="text-red-500 text-sm mt-1">{errors.slug.message}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="tagline" className="block text-sm font-medium mb-1.5">
            Tagline *
          </label>
          <input
            id="tagline"
            {...register('tagline', {
              required: 'Tagline zorunludur',
              minLength: { value: 10, message: 'En az 10 karakter' },
              maxLength: { value: 160, message: 'En fazla 160 karakter' },
            })}
            className="admin-input"
            placeholder="Tek satırda değer önerisi (örn: Next.js 14 + Prisma ile hazır SaaS başlangıcı)"
          />
          {errors.tagline && (
            <p className="text-red-500 text-sm mt-1">{errors.tagline.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium mb-1.5">
            Kısa Açıklama *
          </label>
          <textarea
            id="description"
            rows={3}
            {...register('description', {
              required: 'Açıklama zorunludur',
              minLength: { value: 20, message: 'En az 20 karakter' },
              maxLength: { value: 500, message: 'En fazla 500 karakter' },
            })}
            className="admin-input resize-y min-h-[80px]"
            placeholder="Vitrin kartında görünecek kısa açıklama"
          />
          {errors.description && (
            <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
          )}
        </div>
      </section>

      {/* KATEGORI + FIYAT */}
      <section className="glass-card-premium p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Kategori & Fiyatlandırma
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="category" className="block text-sm font-medium mb-1.5">
              Kategori *
            </label>
            <select
              id="category"
              {...register('category', { required: true })}
              className="admin-input"
            >
              {TEMPLATE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c === 'ecommerce'
                    ? 'E-Ticaret'
                    : c === 'saas'
                      ? 'SaaS'
                      : c === 'portfolio'
                        ? 'Portfolyo'
                        : 'Blog'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="priceCents" className="block text-sm font-medium mb-1.5">
              Fiyat (cent) *
            </label>
            <Controller
              name="priceCents"
              control={control}
              rules={{ required: true, min: 0 }}
              render={({ field }) => (
                <div>
                  <input
                    id="priceCents"
                    type="number"
                    min={0}
                    step={100}
                    value={field.value}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    className="admin-input"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    ≈ {formatCurrency(Number(field.value) || 0, watch('currency'))}
                  </p>
                </div>
              )}
            />
          </div>

          <div>
            <label htmlFor="currency" className="block text-sm font-medium mb-1.5">
              Para Birimi
            </label>
            <select
              id="currency"
              {...register('currency', { required: true })}
              className="admin-input"
            >
              {SUPPORTED_CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">
            Lisans Tipi *
          </label>
          <Controller
            name="licenseType"
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {TEMPLATE_LICENSE_TYPES.map((type) => (
                  <label
                    key={type}
                    className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      field.value === type
                        ? 'border-brand-primary bg-brand-primary/5'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      value={type}
                      checked={field.value === type}
                      onChange={() => field.onChange(type)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-sm">
                        {type === 'single'
                          ? 'Single'
                          : type === 'white-label'
                            ? 'White-Label'
                            : 'Agency'}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {type === 'single'
                          ? 'Tek domain için kullanım'
                          : type === 'white-label'
                            ? 'Marka + özel domain'
                            : 'Çoklu müşteri lisansı'}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          />
        </div>
      </section>

      {/* GORSELLER */}
      <section className="glass-card-premium p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Önizleme Görselleri
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          PNG, JPG veya WEBP — ilk görsel vitrin kartında kapak olarak kullanılır.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {previewImages?.map((url, idx) => (
            <div
              key={`${url}-${idx}`}
              className="relative aspect-video rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`Preview ${idx + 1}`}
                className="w-full h-full object-cover"
              />
              {idx === 0 && (
                <span className="absolute top-1 left-1 px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                  Kapak
                </span>
              )}
              <button
                type="button"
                onClick={() => removeImage(idx)}
                className="absolute top-1 right-1 bg-red-600 text-white p-1.5 rounded-full hover:bg-red-700 transition-colors"
                aria-label="Görseli kaldır"
              >
                <FaTrash className="w-3 h-3" />
              </button>
            </div>
          ))}

          <label
            className={`flex flex-col items-center justify-center aspect-video rounded-lg border-2 border-dashed cursor-pointer transition-colors ${
              uploading
                ? 'border-gray-300 bg-gray-50 cursor-wait'
                : 'border-gray-300 dark:border-gray-600 hover:border-brand-primary hover:bg-brand-primary/5'
            }`}
          >
            <FaUpload
              className={`w-6 h-6 text-gray-400 mb-2 ${uploading ? 'animate-bounce' : ''}`}
            />
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {uploading ? 'Yükleniyor...' : 'Görsel Ekle'}
            </span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload(file);
                e.target.value = '';
              }}
            />
          </label>
        </div>

        <div>
          <label htmlFor="demoUrl" className="block text-sm font-medium mb-1.5">
            Demo URL (opsiyonel)
          </label>
          <input
            id="demoUrl"
            type="url"
            {...register('demoUrl')}
            className="admin-input"
            placeholder="https://demo.example.com"
          />
        </div>
      </section>

      {/* FEATURES */}
      <section className="glass-card-premium p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Özellikler
        </h2>
        <div className="flex gap-2">
          <input
            value={featureInput}
            onChange={(e) => setFeatureInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addFeature();
              }
            }}
            className="admin-input flex-1"
            placeholder="örn: NextAuth + OAuth"
          />
          <button
            type="button"
            onClick={addFeature}
            className="admin-btn admin-btn-secondary px-4"
            aria-label="Özellik ekle"
          >
            <FaPlus className="w-3 h-3" />
          </button>
        </div>
        {features && features.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {features.map((f, idx) => (
              <span
                key={`${f}-${idx}`}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-sm"
              >
                <FaCheckCircle className="w-3 h-3" />
                {f}
                <button
                  type="button"
                  onClick={() => removeFeature(idx)}
                  className="hover:text-red-500"
                  aria-label={`${f} kaldır`}
                >
                  <FaTimes className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </section>

      {/* TECH STACK */}
      <section className="glass-card-premium p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Teknoloji Yığını
        </h2>
        <div className="flex gap-2">
          <input
            value={techInput}
            onChange={(e) => setTechInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addTech();
              }
            }}
            className="admin-input flex-1"
            placeholder="örn: TypeScript"
          />
          <button
            type="button"
            onClick={addTech}
            className="admin-btn admin-btn-secondary px-4"
            aria-label="Teknoloji ekle"
          >
            <FaPlus className="w-3 h-3" />
          </button>
        </div>
        {techStack && techStack.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {techStack.map((t, idx) => (
              <span
                key={`${t}-${idx}`}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm"
              >
                {t}
                <button
                  type="button"
                  onClick={() => removeTech(idx)}
                  className="hover:text-red-500"
                  aria-label={`${t} kaldır`}
                >
                  <FaTimes className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </section>

      {/* LONG DESCRIPTION (markdown) */}
      <section className="glass-card-premium p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Uzun Açıklama (Markdown)
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Template detay sayfasında görünecek detaylı açıklama. Markdown formatında yazabilirsiniz.
        </p>
        <Controller
          name="longDescription"
          control={control}
          render={({ field }) => (
            <CustomEditor
              value={field.value ?? ''}
              onChange={(text) => field.onChange(text)}
            />
          )}
        />
      </section>

      {/* VERSIYON + STATUS */}
      <section className="glass-card-premium p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Versiyon & Durum
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="version" className="block text-sm font-medium mb-1.5">
              Versiyon *
            </label>
            <input
              id="version"
              {...register('version', {
                required: 'Versiyon zorunludur',
                pattern: {
                  value: /^\d+\.\d+(\.\d+)?$/,
                  message: 'Format: MAJOR.MINOR[.PATCH]',
                },
              })}
              className="admin-input"
              placeholder="1.0.0"
            />
            {errors.version && (
              <p className="text-red-500 text-sm mt-1">{errors.version.message}</p>
            )}
          </div>

          <label className="flex items-center gap-2 pt-6 text-sm">
            <input
              type="checkbox"
              {...register('active')}
              className="h-4 w-4 rounded border-gray-300 text-brand-primary"
            />
            <span>Aktif (vitrin)</span>
          </label>

          <label className="flex items-center gap-2 pt-6 text-sm">
            <input
              type="checkbox"
              {...register('featured')}
              className="h-4 w-4 rounded border-gray-300 text-brand-primary"
            />
            <span>Öne Çıkan</span>
          </label>
        </div>
      </section>

      {/* ACTIONS */}
      <div className="flex flex-col sm:flex-row gap-3 sm:justify-end sticky bottom-0 bg-white dark:bg-gray-900 py-3 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={() => router.back()}
          className="admin-btn admin-btn-secondary order-2 sm:order-1"
        >
          İptal
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="admin-btn admin-btn-primary order-1 sm:order-2"
        >
          {isSubmitting
            ? 'Kaydediliyor...'
            : isEditMode
              ? 'Değişiklikleri Kaydet'
              : 'Template Oluştur'}
        </button>
      </div>
    </form>
  );
}

// =================== EXPORTS ===================

/** TemplateListing → form data mapper (server component tarafinda kullanilir). */
export function templateToFormData(template: {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  longDescription: string | null;
  category: string;
  previewImages: unknown;
  demoUrl: string | null;
  priceCents: number;
  currency: string;
  licenseType: string;
  features: unknown;
  techStack: unknown;
  version: string;
  active: boolean;
  featured: boolean;
}): AdminTemplateFormData {
  return {
    id: template.id,
    slug: template.slug,
    name: template.name,
    tagline: template.tagline,
    description: template.description,
    longDescription: template.longDescription,
    category: template.category as AdminTemplateFormData['category'],
    previewImages: asStringArray(template.previewImages),
    demoUrl: template.demoUrl,
    priceCents: template.priceCents,
    currency: template.currency as AdminTemplateFormData['currency'],
    licenseType: template.licenseType as AdminTemplateFormData['licenseType'],
    features: asStringArray(template.features),
    techStack: asStringArray(template.techStack),
    version: template.version,
    active: template.active,
    featured: template.featured,
  };
}
