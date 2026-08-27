/**
 * @file NewProductForm — SaaS Marketplace için yeni dijital ürün oluşturma formu.
 *
 * - Title'dan otomatik slug üretir (TR karakter desteği)
 * - Markdown açıklama alanı (min 50 karakter)
 * - Fiyat TL bazlı, priceCents'e çevrilerek gönderilir
 * - Teknoloji tag'leri eklenip çıkarılabilir
 * - POST /api/user/products
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { FaTrash } from 'react-icons/fa';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { formatCurrency } from '@/lib/utils';

const CATEGORIES = [
  { value: 'starter', label: 'Starter Template' },
  { value: 'template', label: 'UI Template' },
  { value: 'library', label: 'Component Library' },
  { value: 'boilerplate', label: 'Boilerplate' },
  { value: 'api', label: 'API Service' },
  { value: 'saas', label: 'SaaS Tool' },
  { value: 'general', label: 'Genel' },
];

export function NewProductForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    slug: '',
    shortDescription: '',
    description: '',
    thumbnail: '',
    fileUrl: '',
    fileName: '',
    fileSize: 0,
    priceCents: 0,
    category: 'general',
    technologies: [] as string[],
    version: '1.0.0',
  });
  const [techInput, setTechInput] = useState('');

  const generateSlug = (text: string) => {
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
  };

  const handleTitleChange = (title: string) => {
    setForm((prev) => ({
      ...prev,
      title,
      slug: prev.slug || generateSlug(title),
    }));
  };

  const addTech = () => {
    const trimmed = techInput.trim();
    if (trimmed && !form.technologies.includes(trimmed)) {
      setForm((prev) => ({ ...prev, technologies: [...prev.technologies, trimmed] }));
      setTechInput('');
    }
  };

  const removeTech = (tech: string) => {
    setForm((prev) => ({ ...prev, technologies: prev.technologies.filter((t) => t !== tech) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.title.length < 3) {
      toast.error('Başlık en az 3 karakter olmalı');
      return;
    }
    if (!form.slug.match(/^[a-z0-9-]+$/)) {
      toast.error('Slug sadece küçük harf, rakam ve tire içerebilir');
      return;
    }
    if (form.description.length < 50) {
      toast.error('Açıklama en az 50 karakter olmalı');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/user/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error?.message);
      toast.success('Ürün oluşturuldu!');
      router.push('/dashboard/products');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Hata');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="glass-card-premium p-6 space-y-5">
      {/* Title + Slug */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Başlık *</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            required
            minLength={3}
            maxLength={100}
            className="admin-input"
            placeholder="Modern SaaS Starter"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">URL Slug *</label>
          <input
            type="text"
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase() })}
            required
            pattern="^[a-z0-9-]+$"
            className="admin-input font-mono text-sm"
            placeholder="modern-saas-starter"
          />
          <p className="text-xs text-muted-foreground mt-1">noktanyus.com/magaza/[slug]</p>
        </div>
      </div>

      {/* Short description */}
      <div>
        <label className="block text-sm font-medium mb-2">Kısa Açıklama *</label>
        <input
          type="text"
          value={form.shortDescription}
          onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
          required
          minLength={10}
          maxLength={200}
          className="admin-input"
          placeholder="Modern, performanslı SaaS starter template"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium mb-2">Detaylı Açıklama *</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          required
          minLength={50}
          rows={8}
          className="admin-input font-mono text-sm"
          placeholder="# Özellikler&#10;- Modern UI&#10;- TypeScript&#10;..."
        />
        <p className="text-xs text-muted-foreground mt-1">Markdown desteklenir. Min 50 karakter.</p>
      </div>

      {/* Category + Price */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Kategori</label>
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="admin-input"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Fiyat (TL) *</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={form.priceCents / 100}
            onChange={(e) =>
              setForm({
                ...form,
                priceCents: Math.round(parseFloat(e.target.value || '0') * 100),
              })
            }
            required
            className="admin-input"
            placeholder="99.00"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Önizleme: {formatCurrency(form.priceCents)}
          </p>
        </div>
      </div>

      {/* Tech */}
      <div>
        <label className="block text-sm font-medium mb-2">Teknolojiler</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={techInput}
            onChange={(e) => setTechInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addTech();
              }
            }}
            className="admin-input flex-1"
            placeholder="React, TypeScript, Next.js (Enter ile ekle)"
          />
          <button type="button" onClick={addTech} className="admin-btn admin-btn-secondary">
            Ekle
          </button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {form.technologies.map((tech) => (
            <span key={tech} className="glass-tag flex items-center gap-1">
              {tech}
              <button
                type="button"
                onClick={() => removeTech(tech)}
                className="text-destructive"
                aria-label={`${tech} kaldır`}
              >
                <FaTrash className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Thumbnail — drag & drop, URL fallback veya R2 upload */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Ürün Thumbnail Görseli
        </label>
        <ImageUpload
          type="product"
          value={form.thumbnail}
          onChange={(url) => setForm({ ...form, thumbnail: url })}
          aspectRatio="16/9"
          placeholder="Ürün görselini sürükle veya tıkla"
        />
      </div>

      {/* File */}
      <div>
        <label className="block text-sm font-medium mb-2">Dosya URL (R2/S3) *</label>
        <input
          type="text"
          value={form.fileUrl}
          onChange={(e) => setForm({ ...form, fileUrl: e.target.value })}
          required
          className="admin-input font-mono text-sm"
          placeholder="r2:noktanyus/products/my-product.zip"
        />
        <p className="text-xs text-muted-foreground mt-1">Ödeme sonrası signed URL ile indirilir</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Dosya Adı</label>
          <input
            type="text"
            value={form.fileName}
            onChange={(e) => setForm({ ...form, fileName: e.target.value })}
            className="admin-input"
            placeholder="my-product.zip"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Boyut (bytes)</label>
          <input
            type="number"
            min="0"
            value={form.fileSize || ''}
            onChange={(e) =>
              setForm({ ...form, fileSize: parseInt(e.target.value || '0') })
            }
            className="admin-input"
            placeholder="5242880"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Versiyon</label>
        <input
          type="text"
          value={form.version}
          onChange={(e) => setForm({ ...form, version: e.target.value })}
          className="admin-input"
          placeholder="1.0.0"
        />
      </div>

      <div className="flex gap-3 pt-4 border-t">
        <button type="submit" disabled={loading} className="admin-btn admin-btn-primary flex-1">
          {loading ? 'Oluşturuluyor...' : 'Ürünü Yayınla'}
        </button>
        <button type="button" onClick={() => router.back()} className="admin-btn admin-btn-secondary">
          İptal
        </button>
      </div>
    </form>
  );
}