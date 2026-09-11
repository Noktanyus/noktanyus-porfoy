/**
 * AdminProductForm — Admin paneli dijital ürün oluşturma/düzenleme formu.
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

const CATEGORIES = [
  { value: 'starter', label: 'Starter Template' },
  { value: 'template', label: 'UI Template' },
  { value: 'library', label: 'Component Library' },
  { value: 'boilerplate', label: 'Boilerplate' },
  { value: 'api', label: 'API Service' },
  { value: 'saas', label: 'SaaS Tool' },
  { value: 'general', label: 'Genel' },
];

export type AdminProductFormValues = {
  id?: string;
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  thumbnail?: string | null;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  priceCents: number;
  category: string;
  technologies: string[];
  version: string;
  active: boolean;
  featured: boolean;
};

function generateSlug(text: string) {
  return text
    .toLowerCase()
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function AdminProductForm({ product }: { product?: AdminProductFormValues }) {
  const router = useRouter();
  const isEdit = Boolean(product?.id);
  const [loading, setLoading] = useState(false);
  const [techInput, setTechInput] = useState('');
  const [form, setForm] = useState({
    title: product?.title ?? '',
    slug: product?.slug ?? '',
    shortDescription: product?.shortDescription ?? '',
    description: product?.description ?? '',
    thumbnail: product?.thumbnail ?? '',
    fileUrl: product?.fileUrl ?? '',
    fileName: product?.fileName ?? '',
    fileSize: product?.fileSize ?? 0,
    priceTl: product ? (product.priceCents / 100).toFixed(2) : '',
    category: product?.category ?? 'general',
    technologies: product?.technologies ?? ([] as string[]),
    version: product?.version ?? '1.0.0',
    active: product?.active ?? true,
    featured: product?.featured ?? false,
  });

  const handleTitleChange = (title: string) => {
    setForm((prev) => ({
      ...prev,
      title,
      slug: isEdit ? prev.slug : prev.slug || generateSlug(title),
    }));
  };

  const addTech = () => {
    const trimmed = techInput.trim();
    if (trimmed && !form.technologies.includes(trimmed)) {
      setForm((prev) => ({ ...prev, technologies: [...prev.technologies, trimmed] }));
      setTechInput('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const priceCents = Math.round(parseFloat(form.priceTl || '0') * 100);
    if (Number.isNaN(priceCents) || priceCents < 0) {
      toast.error('Geçerli bir fiyat girin');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        title: form.title,
        slug: form.slug,
        shortDescription: form.shortDescription,
        description: form.description,
        thumbnail: form.thumbnail || null,
        fileUrl: form.fileUrl,
        fileName: form.fileName,
        fileSize: Number(form.fileSize) || 0,
        priceCents,
        category: form.category,
        technologies: form.technologies,
        version: form.version,
        active: form.active,
        featured: form.featured,
      };

      const res = await fetch(
        isEdit ? `/api/admin/products/${product!.id}` : '/api/admin/products',
        {
          method: isEdit ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (!data.success) throw new Error(data.error?.message ?? 'Kayıt başarısız');
      toast.success(isEdit ? 'Ürün güncellendi' : 'Ürün oluşturuldu');
      router.push('/admin/products');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Hata');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="glass-card-premium p-6 space-y-5 max-w-3xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Başlık *</label>
          <input
            required
            value={form.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Slug *</label>
          <input
            required
            value={form.slug}
            onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 font-mono text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Kısa açıklama *</label>
        <input
          required
          minLength={10}
          value={form.shortDescription}
          onChange={(e) => setForm((p) => ({ ...p, shortDescription: e.target.value }))}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Açıklama * (min 50 karakter)</label>
        <textarea
          required
          minLength={50}
          rows={6}
          value={form.description}
          onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Fiyat (TL) *</label>
          <input
            required
            type="number"
            min="0"
            step="0.01"
            value={form.priceTl}
            onChange={(e) => setForm((p) => ({ ...p, priceTl: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Kategori</label>
          <select
            value={form.category}
            onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Dosya URL *</label>
          <input
            required
            value={form.fileUrl}
            onChange={(e) => setForm((p) => ({ ...p, fileUrl: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Dosya adı *</label>
          <input
            required
            value={form.fileName}
            onChange={(e) => setForm((p) => ({ ...p, fileName: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Dosya boyutu (byte)</label>
          <input
            type="number"
            min="0"
            value={form.fileSize}
            onChange={(e) => setForm((p) => ({ ...p, fileSize: Number(e.target.value) || 0 }))}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Kapak görseli URL</label>
        <input
          type="url"
          value={form.thumbnail}
          onChange={(e) => setForm((p) => ({ ...p, thumbnail: e.target.value }))}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Teknolojiler</label>
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
            className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
            placeholder="Örn. Next.js"
          />
          <button type="button" onClick={addTech} className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700">
            Ekle
          </button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {form.technologies.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() =>
                setForm((p) => ({ ...p, technologies: p.technologies.filter((x) => x !== t) }))
              }
              className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200"
            >
              {t} ×
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-6">
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => setForm((p) => ({ ...p, active: e.target.checked }))}
          />
          Aktif
        </label>
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.featured}
            onChange={(e) => setForm((p) => ({ ...p, featured: e.target.checked }))}
          />
          Öne çıkan
        </label>
        <div>
          <label className="block text-sm font-medium mb-1">Sürüm</label>
          <input
            value={form.version}
            onChange={(e) => setForm((p) => ({ ...p, version: e.target.value }))}
            className="w-32 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
          />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2.5 rounded-xl text-sm font-bold bg-brand-primary text-white hover:bg-brand-primary/90 disabled:opacity-50"
        >
          {loading ? 'Kaydediliyor...' : isEdit ? 'Güncelle' : 'Oluştur'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/admin/products')}
          className="px-5 py-2.5 rounded-xl text-sm font-medium border border-gray-300 dark:border-gray-600"
        >
          İptal
        </button>
      </div>
    </form>
  );
}
