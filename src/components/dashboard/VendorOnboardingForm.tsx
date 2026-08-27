'use client';

/**
 * VendorOnboardingForm — yeni satıcı profili oluşturma formu.
 *
 * - displayName + slug zorunlu
 * - slug formatı: a-z, 0-9, tire
 * - opsiyonel: bio, website, twitter, github
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

export function VendorOnboardingForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    displayName: '',
    slug: '',
    bio: '',
    website: '',
    twitter: '',
    github: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const slugify = (text: string): string => {
    return text
      .toLowerCase()
      .replace(/ı/g, 'i')
      .replace(/ü/g, 'u')
      .replace(/ö/g, 'o')
      .replace(/ş/g, 's')
      .replace(/ç/g, 'c')
      .replace(/ğ/g, 'g')
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60);
  };

  const handleDisplayNameChange = (value: string) => {
    setForm((prev) => ({
      ...prev,
      displayName: value,
      // Slug boşsa otomatik öner
      slug: prev.slug === '' || prev.slug === slugify(prev.displayName) ? slugify(value) : prev.slug,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Client-side hızlı validasyon
    const next: Record<string, string> = {};
    if (form.displayName.trim().length < 2) next.displayName = 'En az 2 karakter gerekli';
    if (!/^[a-z0-9-]+$/.test(form.slug) || form.slug.length < 3) {
      next.slug = 'Slug sadece küçük harf, rakam ve tire içerebilir (min 3)';
    }
    if (Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/marketplace/vendor/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: form.displayName.trim(),
          slug: form.slug,
          bio: form.bio.trim() || undefined,
          website: form.website.trim() || undefined,
          twitter: form.twitter.trim() || undefined,
          github: form.github.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        if (data.error?.code === 'CONFLICT') {
          if (data.error.message?.includes('slug')) {
            setErrors({ slug: 'Bu slug zaten kullanılıyor' });
          } else {
            toast.error(data.error.message || 'Bu kullanıcının zaten profili var');
          }
          return;
        }
        toast.error(data.error?.message || 'Profil oluşturulamadı');
        return;
      }

      toast.success('Vendor profili oluşturuldu!');
      router.refresh();
      router.push('/dashboard/vendor');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Bilinmeyen hata');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="glass-card-premium p-6 space-y-5">
      <div>
        <label htmlFor="displayName" className="block text-sm font-medium mb-1.5">
          Mağaza İsmi <span className="text-red-500">*</span>
        </label>
        <input
          id="displayName"
          type="text"
          value={form.displayName}
          onChange={(e) => handleDisplayNameChange(e.target.value)}
          maxLength={100}
          placeholder="Örn: Acme Studios"
          className="admin-input"
          required
        />
        {errors.displayName && (
          <p className="text-xs text-red-500 mt-1">{errors.displayName}</p>
        )}
      </div>

      <div>
        <label htmlFor="slug" className="block text-sm font-medium mb-1.5">
          URL Slug <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">/magaza/</span>
          <input
            id="slug"
            type="text"
            value={form.slug}
            onChange={(e) => setForm((p) => ({ ...p, slug: slugify(e.target.value) }))}
            minLength={3}
            maxLength={60}
            placeholder="acme-studios"
            className="admin-input flex-1"
            required
          />
        </div>
        {errors.slug ? (
          <p className="text-xs text-red-500 mt-1">{errors.slug}</p>
        ) : (
          <p className="text-xs text-muted-foreground mt-1">
            Sadece küçük harf, rakam ve tire. Mağaza URL&apos;inde görünür.
          </p>
        )}
      </div>

      <div>
        <label htmlFor="bio" className="block text-sm font-medium mb-1.5">
          Hakkımızda
        </label>
        <textarea
          id="bio"
          value={form.bio}
          onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
          maxLength={2000}
          rows={4}
          placeholder="Mağazanız hakkında kısa bilgi..."
          className="admin-input"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label htmlFor="website" className="block text-sm font-medium mb-1.5">
            Website
          </label>
          <input
            id="website"
            type="url"
            value={form.website}
            onChange={(e) => setForm((p) => ({ ...p, website: e.target.value }))}
            placeholder="https://..."
            className="admin-input"
          />
        </div>
        <div>
          <label htmlFor="twitter" className="block text-sm font-medium mb-1.5">
            Twitter
          </label>
          <input
            id="twitter"
            type="text"
            value={form.twitter}
            onChange={(e) => setForm((p) => ({ ...p, twitter: e.target.value }))}
            maxLength={50}
            placeholder="kullaniciadi"
            className="admin-input"
          />
        </div>
        <div>
          <label htmlFor="github" className="block text-sm font-medium mb-1.5">
            GitHub
          </label>
          <input
            id="github"
            type="text"
            value={form.github}
            onChange={(e) => setForm((p) => ({ ...p, github: e.target.value }))}
            maxLength={50}
            placeholder="kullaniciadi"
            className="admin-input"
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
        <button
          type="submit"
          disabled={loading}
          className="admin-btn admin-btn-primary inline-flex items-center gap-2 disabled:opacity-50"
        >
          {loading ? 'Oluşturuluyor...' : 'Vendor Profili Oluştur'}
        </button>
      </div>
    </form>
  );
}