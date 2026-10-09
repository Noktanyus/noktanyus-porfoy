'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { DS } from '@/lib/design-system';

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[ğ]/g, 'g')
    .replace(/[ü]/g, 'u')
    .replace(/[ş]/g, 's')
    .replace(/[ı]/g, 'i')
    .replace(/[ö]/g, 'o')
    .replace(/[ç]/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export function PartnerApplyForm({
  defaultEmail,
  defaultName,
}: {
  defaultEmail: string;
  defaultName: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [companyName, setCompanyName] = useState(defaultName || '');
  const [slug, setSlug] = useState(slugify(defaultName || 'partner'));
  const [contactEmail, setContactEmail] = useState(defaultEmail);
  const [website, setWebsite] = useState('');
  const [description, setDescription] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/partner/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: companyName.trim(),
          slug: slug.trim() || slugify(companyName),
          contactEmail: contactEmail.trim(),
          website: website.trim() || undefined,
          description: description.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message ?? 'Başvuru başarısız');
      toast.success('Başvuru alındı');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Hata');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="rounded-2xl border border-border bg-card/50 p-5 space-y-4">
      <label className="block text-sm">
        <span className="font-medium mb-1.5 block">Şirket / marka *</span>
        <input
          className={DS.input}
          required
          value={companyName}
          onChange={(e) => {
            setCompanyName(e.target.value);
            setSlug(slugify(e.target.value));
          }}
        />
      </label>
      <label className="block text-sm">
        <span className="font-medium mb-1.5 block">Slug *</span>
        <input
          className={DS.input}
          required
          value={slug}
          onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
        />
      </label>
      <label className="block text-sm">
        <span className="font-medium mb-1.5 block">İletişim e-posta *</span>
        <input
          type="email"
          className={DS.input}
          required
          value={contactEmail}
          onChange={(e) => setContactEmail(e.target.value)}
        />
      </label>
      <label className="block text-sm">
        <span className="font-medium mb-1.5 block">Web sitesi</span>
        <input
          className={DS.input}
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          placeholder="https://"
        />
      </label>
      <label className="block text-sm">
        <span className="font-medium mb-1.5 block">Açıklama</span>
        <textarea
          className={DS.input}
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </label>
      <button
        type="submit"
        disabled={loading}
        className={`${DS.button.primary} px-5 min-h-[44px]`}
      >
        {loading ? 'Gönderiliyor…' : 'Başvur'}
      </button>
    </form>
  );
}
